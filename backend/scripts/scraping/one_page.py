import asyncio
import json
from pathlib import Path
import sys
from urllib.parse import urlparse
from datetime import datetime
from crawl4ai import *

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

async def main():
    url = "https://cytech.cyu.fr"
    async with AsyncWebCrawler() as crawler:
        result = await crawler.arun(
            url=url,
        )
        
        # Afficher le markdown
        print(result.markdown)
        
        # Sauvegarder le contenu
        if hasattr(result, 'markdown') and hasattr(result.markdown, 'raw_markdown'):
            # Créer un nom de fichier sécurisé
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
            print(f"Metadata saved to {meta_path}")
        else:
            print("No content to save.")

if __name__ == "__main__":
    asyncio.run(main())