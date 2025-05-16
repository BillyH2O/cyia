import sys
import asyncio 
import subprocess
from pathlib import Path

APP_ROOT_DIR = Path(__file__).resolve().parent.parent # scripts/ -> backend/
sys.path.insert(0, str(APP_ROOT_DIR))

from scripts.scraping import all_pages_fast
from scripts.preprocessing import preprocess
from scripts.preprocessing import create_vectorstore 

def ensure_playwright_browsers():
    """Installe Playwright ET ses dépendances système (librairies Linux)"""
    print("Installation des dépendances système + navigateurs Playwright…")
    try:
        # --with-deps ajoute les paquets système nécessaires à Chromium
        subprocess.run(
            [sys.executable, "-m", "playwright", "install", "--with-deps", "chromium"],
            check=True,
        )
        print("Playwright et toutes ses dépendances sont prêts.")
    except subprocess.CalledProcessError as e:
        print("Échec de l'installation Playwright:", e)
        raise

def run_scraping():
    print("\n--- Étape 1: Scraping des données ---")
    # S'assurer que Playwright est correctement installé
    ensure_playwright_browsers()
    asyncio.run(all_pages_fast.main()) 
    print("--- Scraping terminé ---")

def run_preprocessing():
    print("\n--- Étape 2: Prétraitement des données ---")
    preprocess.main()
    print("--- Prétraitement terminé ---")

def run_vectorstore_creation():
    print("\n--- Étape 3: Création du Vectorstore ---")
    create_vectorstore.main() 
    print("--- Création du Vectorstore terminée ---")

if __name__ == "__main__":
    print("Démarrage du pipeline de données complet...")
    
    run_scraping()
    run_preprocessing()
    run_vectorstore_creation()
    
    print("\nPipeline de données complet terminé avec succès.") 