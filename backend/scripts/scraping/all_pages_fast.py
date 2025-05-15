import os
import sys
import psutil
import asyncio
import requests
import json
from datetime import datetime
from urllib.parse import urlparse
from xml.etree import ElementTree
from pathlib import Path
from typing import List, Dict, Any


APP_ROOT_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(APP_ROOT_DIR))

DATA_DIR = APP_ROOT_DIR / "data"
RAW_DIR = DATA_DIR / "raw"

DATA_DIR.mkdir(exist_ok=True, parents=True) # Assurer que data existe aussi
RAW_DIR.mkdir(exist_ok=True, parents=True)

from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode

def sanitize_filename(url):
    """Convert URL to a valid filename"""
    parsed = urlparse(url)
    path = parsed.path.replace('/', '_')
    if not path:
        path = '_root'
    return f"{parsed.netloc}{path}"

def get_safe_attribute(obj, attr_name, default=None):
    """Safely get an attribute from an object, returning default if not found"""
    try:
        return getattr(obj, attr_name, default)
    except:
        return default

async def crawl_parallel(urls: List[str], max_concurrent: int = 3):
    print("\n=== Parallel Crawling with Browser Reuse + Memory Check and Content Saving ===")

    # We'll keep track of peak memory usage across all tasks
    peak_memory = 0
    process = psutil.Process(os.getpid())

    def log_memory(prefix: str = ""):
        nonlocal peak_memory
        current_mem = process.memory_info().rss  # in bytes
        if current_mem > peak_memory:
            peak_memory = current_mem
        print(f"{prefix} Current Memory: {current_mem // (1024 * 1024)} MB, Peak: {peak_memory // (1024 * 1024)} MB")

    # Minimal browser config
    browser_config = BrowserConfig(
        headless=True,
        verbose=False,   
        extra_args=["--disable-gpu", "--disable-dev-shm-usage", "--no-sandbox"],
    )
    crawl_config = CrawlerRunConfig(cache_mode=CacheMode.BYPASS)

    # Create the crawler instance
    crawler = AsyncWebCrawler(config=browser_config)
    await crawler.start()

    try:
        # We'll chunk the URLs in batches of 'max_concurrent'
        success_count = 0
        fail_count = 0
        for i in range(0, len(urls), max_concurrent):
            batch = urls[i : i + max_concurrent]
            tasks = []

            for j, url in enumerate(batch):
                # Unique session_id per concurrent sub-task
                session_id = f"parallel_session_{i + j}"
                task = crawler.arun(url=url, config=crawl_config, session_id=session_id)
                tasks.append(task)

            # Check memory usage prior to launching tasks
            log_memory(prefix=f"Before batch {i//max_concurrent + 1}: ")

            # Gather results
            results = await asyncio.gather(*tasks, return_exceptions=True)

            # Check memory usage after tasks complete
            log_memory(prefix=f"After batch {i//max_concurrent + 1}: ")

            # Evaluate results
            for url, result in zip(batch, results):
                if isinstance(result, Exception):
                    print(f"Error crawling {url}: {result}")
                    fail_count += 1
                elif hasattr(result, 'success') and result.success:
                    # Save the content and metadata to file
                    try:
                        safe_filename = sanitize_filename(url)
                        
                        # Extract markdown content safely
                        markdown_content = ""
                        if hasattr(result, 'markdown') and hasattr(result.markdown, 'raw_markdown'):
                            markdown_content = result.markdown.raw_markdown
                        
                        # Save the markdown content
                        md_path = RAW_DIR / f"{safe_filename}.md"
                        with open(md_path, 'w', encoding='utf-8') as f:
                            f.write(markdown_content)
                        
                        # Build metadata with safe attribute access
                        metadata = {
                            "url": url,
                            "crawl_time": datetime.now().isoformat(),
                            "success": True
                        }
                        
                        # Safely add additional attributes if they exist
                        for attr in ['title', 'page_type', 'error_message']:
                            value = get_safe_attribute(result, attr)
                            if value is not None:
                                metadata[attr] = value
                        
                        # Add any available attributes as metadata
                        for attr_name in dir(result):
                            if not attr_name.startswith('_') and attr_name not in ['markdown', 'success']:
                                try:
                                    attr_value = getattr(result, attr_name)
                                    # Only include simple types in metadata
                                    if isinstance(attr_value, (str, int, float, bool, list, dict)) and attr_value is not None:
                                        metadata[attr_name] = attr_value
                                except:
                                    pass
                                    
                        meta_path = RAW_DIR / f"{safe_filename}.json"
                        with open(meta_path, 'w', encoding='utf-8') as f:
                            json.dump(metadata, f, ensure_ascii=False, indent=2)
                            
                        print(f"Saved content for: {url}")
                        success_count += 1
                    except Exception as e:
                        print(f"Error saving content for {url}: {str(e)}")
                        fail_count += 1
                else:
                    fail_count += 1
                    error_msg = get_safe_attribute(result, 'error_message', 'Unknown error')
                    print(f"Failed to crawl {url}: {error_msg}")

        print(f"\nSummary:")
        print(f"  - Successfully crawled and saved: {success_count}")
        print(f"  - Failed: {fail_count}")
        print(f"  - Content saved to: {RAW_DIR}")

    finally:
        print("\nClosing crawler...")
        await crawler.close()
        # Final memory log
        log_memory(prefix="Final: ")
        print(f"\nPeak memory usage (MB): {peak_memory // (1024 * 1024)}")

def get_pydantic_ai_docs_urls():
    """
    Fetches all URLs from the CY TECH website.
    Uses the sitemap (https://cytech.cyu.fr/sitemap.xml) to get these URLs.
    
    Returns:
        List[str]: List of URLs
    """            
    sitemap_url = "https://cytech.cyu.fr/sitemap.xml"
    try:
        response = requests.get(sitemap_url)
        response.raise_for_status()
        
        # Parse the XML
        root = ElementTree.fromstring(response.content)
        
        # Extract all URLs from the sitemap
        # The namespace is usually defined in the root element
        namespace = {'ns': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
        urls = [loc.text for loc in root.findall('.//ns:loc', namespace)]
        
        return urls
    except Exception as e:
        print(f"Error fetching sitemap: {e}")
        return []        

async def main(): # Renommer la fonction main en main_async ou autre si run_pipeline l'appelle
    urls = get_pydantic_ai_docs_urls()
    if urls:
        print(f"Found {len(urls)} URLs to crawl")
        print(f"Content will be saved to: {RAW_DIR}")
        await crawl_parallel(urls, max_concurrent=10) # Garder un max_concurrent raisonnable
    else:
        print("No URLs found to crawl")    

if __name__ == "__main__":
    asyncio.run(main())