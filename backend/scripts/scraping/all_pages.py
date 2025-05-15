import asyncio
import json
import sys
from pathlib import Path
from datetime import datetime
from urllib.parse import urlparse
from typing import List
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig
from crawl4ai.markdown_generation_strategy import DefaultMarkdownGenerator
import requests
from xml.etree import ElementTree

# Ajouter le répertoire parent au chemin de recherche des modules
sys.path.append(str(Path(__file__).parent.parent.parent))

# Définir le chemin de sortie data/raw
ROOT_DIR = Path(__file__).parent.parent.parent.parent
BACKEND_DIR = Path(__file__).parent.parent.parent  # backend/
DATA_DIR = BACKEND_DIR / "data"  # Mise à jour: data est maintenant dans backend/
RAW_DIR = DATA_DIR / "raw"

# Create output directory if it doesn't exist
DATA_DIR.mkdir(exist_ok=True)
RAW_DIR.mkdir(exist_ok=True)

def sanitize_filename(url):
    """Convert URL to a valid filename"""
    parsed = urlparse(url)
    path = parsed.path.replace('/', '_')
    if not path:
        path = '_root'
    return f"{parsed.netloc}{path}"

async def crawl_sequential(urls: List[str]):
    print("\n=== Sequential Crawling with Session Reuse ===")

    browser_config = BrowserConfig(
        headless=True,
        # For better performance in Docker or low-memory environments:
        extra_args=["--disable-gpu", "--disable-dev-shm-usage", "--no-sandbox"],
    )

    crawl_config = CrawlerRunConfig(
        markdown_generator=DefaultMarkdownGenerator()
    )

    # Create the crawler (opens the browser)
    crawler = AsyncWebCrawler(config=browser_config)
    await crawler.start()

    try:
        session_id = "session1"  # Reuse the same session across all URLs
        success_count = 0
        failed_count = 0
        
        for url in urls:
            result = await crawler.arun(
                url=url,
                config=crawl_config,
                session_id=session_id
            )
            if result.success:
                print(f"Successfully crawled: {url}")
                print(f"Markdown length: {len(result.markdown.raw_markdown)}")
                
                # Sauvegarder le contenu
                try:
                    safe_filename = sanitize_filename(url)
                    
                    # Sauvegarder le markdown
                    md_path = RAW_DIR / f"{safe_filename}.md"
                    with open(md_path, 'w', encoding='utf-8') as f:
                        f.write(result.markdown.raw_markdown)
                    
                    # Préparer les métadonnées
                    metadata = {
                        "url": url,
                        "crawl_time": datetime.now().isoformat(),
                        "success": True
                    }
                    
                    # Ajouter les attributs disponibles
                    for attr in ['title', 'page_type']:
                        if hasattr(result, attr):
                            metadata[attr] = getattr(result, attr)
                    
                    # Sauvegarder les métadonnées
                    meta_path = RAW_DIR / f"{safe_filename}.json"
                    with open(meta_path, 'w', encoding='utf-8') as f:
                        json.dump(metadata, f, ensure_ascii=False, indent=2)
                    
                    print(f"Content saved to {md_path}")
                    success_count += 1
                except Exception as e:
                    print(f"Error saving content for {url}: {str(e)}")
                    failed_count += 1
            else:
                print(f"Failed: {url} - Error: {result.error_message}")
                failed_count += 1
                
        print(f"\nSummary:")
        print(f"  - Successfully crawled and saved: {success_count}")
        print(f"  - Failed: {failed_count}")
        print(f"  - Content saved to: {RAW_DIR}")
    finally:
        # After all URLs are done, close the crawler (and the browser)
        await crawler.close()

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

async def main():
    urls = get_pydantic_ai_docs_urls()
    if urls:
        print(f"Found {len(urls)} URLs to crawl")
        print(f"Content will be saved to: {RAW_DIR}")
        await crawl_sequential(urls)
    else:
        print("No URLs found to crawl")

if __name__ == "__main__":
    asyncio.run(main())