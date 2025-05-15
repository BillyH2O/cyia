#!/usr/bin/env python3
"""
Script combiné pour prétraiter les documents et créer un index vectoriel.
"""

import os
import re
import json
import time
import sys
from pathlib import Path
from tqdm import tqdm
from dotenv import load_dotenv
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma

# Ajouter le répertoire parent au chemin de recherche des modules
sys.path.append(str(Path(__file__).parent.parent.parent.parent))

# Import de la configuration
from backend.config import Config

# Charger les variables d'environnement
load_dotenv(dotenv_path=Path(__file__).parents[2] / ".env")

# Définir les répertoires
ROOT_DIR = Path(__file__).parent.parent.parent.parent
BACKEND_DIR = Path(__file__).parent.parent.parent  # backend/
DATA_DIR = BACKEND_DIR / "data"  # Mise à jour: data est maintenant dans backend/
RAW_DIR = DATA_DIR / "raw"
PREPROCESSED_DIR = DATA_DIR / "preprocessed"
LONG_FILES_DIR = PREPROCESSED_DIR / "long_files"
SHORT_FILES_DIR = PREPROCESSED_DIR / "short_files"
VECTORSTORE_DIR = Config.VECTORSTORE_DIR

# Longueur minimale pour considérer un contenu comme "long"
MIN_CONTENT_LENGTH = 200

# Statistiques
stats = {
    "total": 0,
    "long": 0,
    "short": 0,
    "error": 0
}

# Configuration de journalisation
log_file = PREPROCESSED_DIR / "preprocess_log.txt"

def verify_directories():
    """Vérifie et crée les répertoires nécessaires"""
    DATA_DIR.mkdir(exist_ok=True)
    RAW_DIR.mkdir(exist_ok=True)
    PREPROCESSED_DIR.mkdir(exist_ok=True)
    LONG_FILES_DIR.mkdir(exist_ok=True)
    SHORT_FILES_DIR.mkdir(exist_ok=True)
    VECTORSTORE_DIR.mkdir(exist_ok=True)
    
    # Initialiser le fichier de log
    with open(log_file, "w", encoding="utf-8") as f:
        f.write(f"Traitement démarré le {time.strftime('%Y-%m-%d %H:%M:%S')}\n\n")

def log_message(message):
    """Ajoute un message au fichier de log"""
    print(message)
    with open(log_file, "a", encoding="utf-8") as f:
        f.write(f"{message}\n")

def clean_markdown(text, file_path=""):
    """Nettoie le contenu markdown"""
    # Supprimer bannières cookies et navigation
    text = re.sub(r'# Ce site web utilise des cookies.*?Personnaliser', '', text, flags=re.DOTALL)
    
    # Supprimer menus et liens de navigation
    text = re.sub(r'\[Aller au contenu\].*?\[Alumni\]', '', text, flags=re.DOTALL)
    
    # Supprimer les boutons de partage et liens sociaux
    text = re.sub(r'[\*\s]*Imprimer[\s\S]*?Linkedin \]\([^\)]+\)', '', text, flags=re.DOTALL)
    
    # Supprimer pieds de page
    text = re.sub(r'PROGRAMMES.*$', '', text, flags=re.DOTALL)
    
    # Extraire le titre principal
    title_match = re.search(r'# ([^\n]+)', text)
    if title_match:
        title = title_match.group(1)
    else:
        # Essayer de trouver un titre dans le nom du fichier
        filename = Path(file_path).stem
        title = filename.replace('_', ' ').replace('-', ' ')
        log_message(f"ℹ️ Pas de titre trouvé dans {file_path}, utilisation du nom de fichier")
    
    # Extraire le contenu principal
    content_match = re.search(r'# [^\n]+\n(.*?)(\n\!\[\]|\nPROGRAMMES|$)', text, flags=re.DOTALL)
    
    if content_match:
        content = content_match.group(1).strip()
    else:
        # Si la regex ne trouve pas de contenu, prendre tout après le titre
        title_pos = text.find('# ')
        if title_pos >= 0:
            newline_pos = text.find('\n', title_pos)
            if newline_pos >= 0:
                content = text[newline_pos:].strip()
            else:
                content = ""
        else:
            content = text.strip()
            
        if not content:
            log_message(f"ℹ️ Pas de contenu extrait de {file_path}")
    
    # Nettoyer le contenu
    if content:
        # Supprimer les images et légendes
        content = re.sub(r'\!\[([^\]]*)\]\([^\)]+\)(\s+\1\s*-\s*)?', '', content)
        
        # Supprimer la partie "En savoir plus" et liens associés
        content = re.sub(r'\*\*En savoir plus :\*\*[\s\S]*?$', '', content)
        
        # Supprimer les descriptions dupliquées
        sentences = re.findall(r'[^.!?]+[.!?]', content)
        if len(sentences) > 1:
            # Vérifier si la première phrase est répétée immédiatement
            if sentences[0].strip() == sentences[1].strip():
                # Supprimer la répétition
                content = content.replace(sentences[0] + ' ' + sentences[1], sentences[0])
    
    return {"title": title, "content": content}

def process_file(md_file):
    """Traite un fichier markdown et sauvegarde la version nettoyée"""
    try:
        # Lire le contenu du fichier
        with open(md_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Si le contenu est vide, ignorer le fichier
        if not content.strip():
            log_message(f"ℹ️ Fichier vide: {md_file}")
            stats["short"] += 1
            return False
        
        # Récupérer les métadonnées associées
        json_file = md_file.with_suffix('.json')
        if json_file.exists():
            with open(json_file, 'r', encoding='utf-8') as f:
                metadata = json.load(f)
        else:
            metadata = {}
            log_message(f"ℹ️ Pas de métadonnées pour: {md_file}")
        
        # Nettoyer le contenu
        cleaned = clean_markdown(content, str(md_file))
        
        # Fusionner avec les métadonnées
        cleaned.update(metadata)
        
        # Déterminer le répertoire de destination en fonction de la longueur du contenu
        is_short = len(cleaned["content"]) < MIN_CONTENT_LENGTH
        
        if is_short:
            log_message(f"ℹ️ Contenu court ({len(cleaned['content'])} caractères): {md_file}")
            target_dir = SHORT_FILES_DIR
            stats["short"] += 1
        else:
            target_dir = LONG_FILES_DIR
            stats["long"] += 1
        
        # Sauvegarder le résultat MD
        output_file = target_dir / md_file.name
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(f"# {cleaned['title']}\n\n{cleaned['content']}")
        
        # Sauvegarder les métadonnées enrichies
        output_meta = target_dir / f"{md_file.stem}.json"
        with open(output_meta, 'w', encoding='utf-8') as f:
            json.dump(cleaned, f, ensure_ascii=False, indent=2)
        
        return True
        
    except Exception as e:
        log_message(f"❌ Erreur de traitement pour {md_file}: {str(e)}")
        stats["error"] += 1
        return False

def load_md_with_metadata(file_path):
    """Charge un fichier markdown et ses métadonnées associées."""
    # Charger le contenu du fichier markdown
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Vérifier si un fichier JSON de métadonnées existe
    json_path = file_path.with_suffix('.json')
    metadata = {
        "source": str(file_path),
        "filename": file_path.name,
    }
    
    if json_path.exists():
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                json_data = json.load(f)
                # Ajouter des métadonnées utiles pour le RAG
                if 'title' in json_data:
                    metadata['title'] = json_data['title']
                if 'url' in json_data:
                    metadata['url'] = json_data['url']
        except Exception as e:
            print(f"Erreur lors du chargement des métadonnées pour {file_path}: {e}")
    
    return {"content": content, "metadata": metadata}

def preprocess_documents():
    """Prétraite les documents bruts"""
    # Trouver tous les fichiers markdown
    md_files = list(RAW_DIR.glob("*.md"))
    stats["total"] = len(md_files)
    
    log_message(f"Début du prétraitement de {len(md_files)} fichiers...")
    log_message(f"Les fichiers courts (< {MIN_CONTENT_LENGTH} caractères) seront placés dans: {SHORT_FILES_DIR}")
    log_message(f"Les fichiers longs seront placés dans: {LONG_FILES_DIR}")
    
    # Traiter chaque fichier avec barre de progression
    for md_file in tqdm(md_files, desc="Prétraitement des fichiers"):
        process_file(md_file)
    
    # Afficher les statistiques
    log_message("\nStatistiques de prétraitement:")
    log_message(f"  Fichiers traités:      {stats['total']}")
    log_message(f"  Fichiers longs:        {stats['long']}")
    log_message(f"  Fichiers courts:       {stats['short']}")
    log_message(f"  Erreurs:               {stats['error']}")
    
    total_processed = stats['long'] + stats['short']
    success_rate = total_processed / stats['total'] * 100 if stats['total'] > 0 else 0
    log_message(f"  Taux de réussite:      {success_rate:.2f}%")
    
    log_message(f"\nPrétraitement terminé.")

def create_vectorstore():
    """Crée l'index vectoriel à partir des documents prétraités"""
    # Vérifier que la clé API est disponible
    if not os.getenv("OPENAI_API_KEY"):
        log_message("❌ La clé API OpenAI n'a pas été trouvée dans le fichier .env")
        return False
    
    log_message(f"Création de l'index vectoriel à partir des documents prétraités dans {LONG_FILES_DIR}")
    
    # Collecter tous les fichiers markdown dans le répertoire des fichiers longs
    md_files = list(LONG_FILES_DIR.glob("*.md"))
    log_message(f"Trouvé {len(md_files)} fichiers markdown à traiter")
    
    # Charger les documents et leurs métadonnées
    documents = []
    for md_file in tqdm(md_files, desc="Chargement des documents"):
        doc_with_metadata = load_md_with_metadata(md_file)
        documents.append(doc_with_metadata)
    
    # Créer un text splitter pour diviser les documents en chunks
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len,
    )
    
    # Diviser les documents en chunks
    chunks = []
    for doc in tqdm(documents, desc="Division des documents en chunks"):
        split_docs = text_splitter.create_documents(
            texts=[doc["content"]],
            metadatas=[doc["metadata"]]
        )
        chunks.extend(split_docs)
    
    log_message(f"Créé {len(chunks)} chunks de texte à partir de {len(documents)} documents")
    
    # Créer les embeddings
    embeddings = OpenAIEmbeddings()
    
    # Créer l'index vectoriel
    log_message("Création de l'index vectoriel...")
    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=str(VECTORSTORE_DIR)
    )
    
    # Sauvegarder l'index vectoriel
    vectorstore.persist()
    log_message(f"Index vectoriel créé et sauvegardé dans {VECTORSTORE_DIR}")
    return True

def main():
    """Fonction principale"""
    # Vérifier et créer les répertoires
    verify_directories()
    
    # Étape 1: Prétraitement des documents
    preprocess_documents()
    
    # Étape 2: Création de l'index vectoriel
    if stats["long"] > 0:
        create_vectorstore()
    else:
        log_message("⚠️ Aucun document long n'a été créé, l'indexation est ignorée")

if __name__ == "__main__":
    main() 