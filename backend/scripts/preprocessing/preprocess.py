import os
import re
import json
import time
import sys
from pathlib import Path
from tqdm import tqdm

# --- Début des modifications pour Railway ---
# Path(__file__) est /app/scripts/preprocessing/preprocess.py
# Path(__file__).resolve().parent.parent.parent est /app (backend/)
APP_ROOT_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(APP_ROOT_DIR))
# --- Fin des modifications pour Railway ---

# ROOT_DIR devient APP_ROOT_DIR
input_dir = APP_ROOT_DIR / "data/raw"
output_dir = APP_ROOT_DIR / "data/preprocessed"
long_files_dir = output_dir / "long_files"
short_files_dir = output_dir / "short_files"

output_dir.mkdir(exist_ok=True, parents=True)
long_files_dir.mkdir(exist_ok=True, parents=True)
short_files_dir.mkdir(exist_ok=True, parents=True)

MIN_CONTENT_LENGTH = 200

# Statistiques
stats = {
    "total": 0,
    "long": 0,
    "short": 0,
    "error": 0
}

# Configuration de journalisation
log_file = output_dir / "preprocess_log.txt"

def initialize_log(): # Fonction pour initialiser le log seulement si le script est exécuté directement
    with open(log_file, "w", encoding="utf-8") as f:
        f.write(f"Prétraitement démarré le {time.strftime('%Y-%m-%d %H:%M:%S')}\n\n")

def log_message(message):
    print(message)
    with open(log_file, "a", encoding="utf-8") as f:
        f.write(f"{message}\n")

def clean_markdown(text, file_path=""):
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
            target_dir = short_files_dir
            stats["short"] += 1
        else:
            target_dir = long_files_dir
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

def main():
    initialize_log() # Initialiser le log au début de main
    # Trouver tous les fichiers markdown
    md_files = list(input_dir.glob("*.md"))
    stats["total"] = len(md_files)
    
    log_message(f"Début du prétraitement de {len(md_files)} fichiers...")
    log_message(f"Les fichiers courts (< {MIN_CONTENT_LENGTH} caractères) seront placés dans: {short_files_dir}")
    log_message(f"Les fichiers longs seront placés dans: {long_files_dir}")
    
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

if __name__ == "__main__":
    main() 