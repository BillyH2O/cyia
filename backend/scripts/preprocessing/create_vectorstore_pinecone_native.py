import os
import sys
import uuid # For generating unique IDs for Pinecone records
from dotenv import load_dotenv
from langchain_community.document_loaders import DirectoryLoader, TextLoader # type: ignore
from langchain.text_splitter import RecursiveCharacterTextSplitter
# OpenAIEmbeddings and Chroma are no longer needed as we focus on Pinecone native

# PINECONE IMPORTS
from pinecone import Pinecone, ServerlessSpec # For direct Pinecone client usage
# END PINECONE IMPORTS

import json
from tqdm import tqdm # type: ignore
from pathlib import Path
import unicodedata
import re
import time # Ajout pour la temporisation

# --- Configuration Globale ---
# Path(__file__) est /app/scripts/preprocessing/create_vectorstore_pinecone_native.py
# Path(__file__).resolve().parent.parent.parent est /app (backend/)
APP_ROOT_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(APP_ROOT_DIR))

# Charger les variables d'environnement depuis backend/.env
load_dotenv(dotenv_path=APP_ROOT_DIR / ".env")

# --- Configuration OpenAI (pour Chroma local) --- Supprimée car Chroma est supprimé
# OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
# assert OPENAI_API_KEY, "La clé API OpenAI (OPENAI_API_KEY) n'a pas été trouvée dans le fichier .env pour Chroma."

# --- Configuration Pinecone (pour l'index 'cyia' avec embedding intégré) ---
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
# Pour les index serverless, l'environnement est la région cloud.
PINECONE_ENVIRONMENT = os.getenv("PINECONE_ENVIRONMENT", "us-east-1") # Votre région pour 'cyia'
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "cyia")      # Votre nom d'index 'cyia'

pinecone_enabled_native = PINECONE_API_KEY and PINECONE_ENVIRONMENT and PINECONE_INDEX_NAME
if not pinecone_enabled_native:
    # Si les variables Pinecone ne sont pas là, le script ne peut rien faire.
    print(f"Variables d'environnement Pinecone (PINECONE_API_KEY, PINECONE_ENVIRONMENT, PINECONE_INDEX_NAME) "
          "non trouvées ou incomplètes. Arrêt du script.")
    sys.exit(1) # Quitter si Pinecone n'est pas configuré

# --- Chemins des Données (relatifs à APP_ROOT_DIR qui est /backend) ---
DATA_DIR = APP_ROOT_DIR / "data"
PREPROCESSED_DIR = DATA_DIR / "preprocessed"
LONG_FILES_DIR = PREPROCESSED_DIR / "long_files"
# VECTORSTORE_DIR_CHROMA = DATA_DIR / "vectorstore_chroma" # Supprimé

# --- Fonctions Utilitaires ---
def load_md_with_metadata(file_path: Path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    json_path = file_path.with_suffix('.json')
    metadata = {
        "source": str(file_path.relative_to(APP_ROOT_DIR)), # Chemin relatif pour la source
        "filename": file_path.name,
    }
    
    if json_path.exists():
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                json_data = json.load(f)
                if 'title' in json_data:
                    metadata['title'] = json_data['title']
                if 'url' in json_data:
                    metadata['url'] = json_data['url']
        except Exception as e:
            print(f"Erreur lors du chargement des métadonnées JSON pour {file_path}: {e}")
    
    return {"content": content, "metadata": metadata}

# Helper pour générer un ID ASCII compatible Pinecone
def sanitize_id(raw: str, max_len: int = 256) -> str:
    # Translittération ASCII puis remplacement des caractères non autorisés
    normalized = unicodedata.normalize('NFKD', raw).encode('ascii', 'ignore').decode('ascii')
    sanitized = re.sub(r'[^A-Za-z0-9_-]', '_', normalized)
    return sanitized[:max_len]

# --- Fonctions Principales du Pipeline --- Supprimée car Chroma est supprimé
# def create_local_chroma_vectorstore(chunks, embeddings_openai):
#     ...

def upsert_to_pinecone_native(chunks_lc): 
    if not pinecone_enabled_native:
        # Cette vérification est déjà faite globalement, mais on la garde par sécurité
        print("\n--- Intégration Pinecone native désactivée (variables d'environnement manquantes) ---")
        return

    print(f"\n--- Tentative d'upsert vers l'index Pinecone natif '{PINECONE_INDEX_NAME}' (région: {PINECONE_ENVIRONMENT}) ---")
    
    try:
        pc = Pinecone(api_key=PINECONE_API_KEY)
        
        # Récupérer la liste des index disponibles, gérer plusieurs formats selon la version du client
        try:
            raw_indexes = pc.list_indexes()
        except Exception as li_err:
            print(f"Impossible de lister les index Pinecone : {li_err}")
            return

        # Normaliser en liste de chaînes
        available_indexes = None
        if isinstance(raw_indexes, (list, tuple, set)):
            available_indexes = list(raw_indexes)
        else:
            # Essayer différents attributs possibles
            for attr in ("names", "indexes", "data"):
                if hasattr(raw_indexes, attr):
                    val = getattr(raw_indexes, attr)
                    val = val() if callable(val) else val
                    if isinstance(val, (list, tuple, set)):
                        available_indexes = list(val)
                        break

        if available_indexes is None:
            print(f"Format inattendu de retour pour list_indexes(): {raw_indexes}")
            return

        if PINECONE_INDEX_NAME not in available_indexes:
            print(f"L'index Pinecone '{PINECONE_INDEX_NAME}' n'existe pas.")
            # Instructions pour créer l'index (si l'utilisateur doit le faire manuellement)
            print("Veuillez créer l'index via la console Pinecone avec les spécifications suivantes:")
            print(f"  Nom: {PINECONE_INDEX_NAME}")
            print(f"  Dimensions: 1024 (pour llama-text-embed-v2 ou modèle équivalent)")
            print(f"  Métrique: cosine")
            print(f"  Cloud: aws, Région: {PINECONE_ENVIRONMENT}")
            print(f"  Modèle d'embedding intégré: ex: llama-text-embed-v2 (champ source 'text')")
            return
        
        pinecone_index = pc.Index(PINECONE_INDEX_NAME)
        print(f"Connecté à l'index Pinecone '{PINECONE_INDEX_NAME}'. Stats actuelles: {pinecone_index.describe_index_stats()}")

        records_to_upsert = []
        for i, chunk_doc in enumerate(tqdm(chunks_lc, desc="Préparation des données pour Pinecone")):
            metadata_for_pinecone = chunk_doc.metadata.copy()  # autres champs deviendront metadata

            for key, value in metadata_for_pinecone.items():
                if isinstance(value, Path):
                    metadata_for_pinecone[key] = str(value)
                elif not isinstance(value, (str, int, float, bool, list)):
                     metadata_for_pinecone[key] = str(value) 
                elif isinstance(value, list) and not all(isinstance(item, str) for item in value):
                    metadata_for_pinecone[key] = [str(item) for item in value]

            record_id_base = metadata_for_pinecone.get("filename", f"doc_unknown_{i}")
            record_id = sanitize_id(f"{record_id_base}_chunk_{i}")

            record = {
                "_id": record_id or str(uuid.uuid4()),  # Pinecone accepte '_id' ou 'id'
                "text": chunk_doc.page_content,          # Champ texte pour l'embedding intégré
            }
            # ajouter le reste des métadonnées (titre, source, etc.)
            record.update(metadata_for_pinecone)
            records_to_upsert.append(record)

        batch_size = 96
        print(f"Upsert de {len(records_to_upsert)} chunks vers Pinecone (upsert_records) en lots de {batch_size}...")

        # Estimation pour la temporisation afin de respecter les limites de tokens/minute
        # (Ceci est une estimation, les longueurs réelles des chunks peuvent varier)
        # Limite: 250,000 tokens/minute pour llama-text-embed-v2 sur le plan gratuit.
        # Un chunk fait ~200-300 tokens en moyenne (chunk_size=1000 char ~ 250 tokens, plus overhead)
        APPROX_TOKENS_PER_CHUNK = 250 
        TOKENS_LIMIT_PER_MINUTE = 250000
        SECONDS_IN_MINUTE = 60

        # Nombre de lots que nous pouvons théoriquement envoyer par minute
        # tokens_per_batch = APPROX_TOKENS_PER_CHUNK * batch_size
        # batches_per_minute_limit = TOKENS_LIMIT_PER_MINUTE / tokens_per_batch
        # sleep_duration_seconds = SECONDS_IN_MINUTE / batches_per_minute_limit if batches_per_minute_limit > 0 else SECONDS_IN_MINUTE
        # Simplifié: chaque lot de 96 chunks * 250 tokens/chunk = 24000 tokens.
        # 250000 / 24000 = ~10.4 lots par minute. Donc ~6 secondes par lot.
        # On prend une marge de sécurité.
        sleep_duration_seconds = 7.0 

        for i in range(0, len(records_to_upsert), batch_size):
            batch = records_to_upsert[i:i + batch_size]
            try:
                pinecone_index.upsert_records("", batch)  # namespace par défaut ""
                print(f"Lot {i//batch_size + 1} / {len(records_to_upsert)//batch_size + 1} envoyé avec succès.")
            except Exception as batch_e: # Idéalement, intercepter pinecone.core.client.exceptions.ApiException
                print(f"Erreur lors de l'upsert_records du lot {i//batch_size + 1} : {batch_e}")
                # Si c'est une erreur de type "Too Many Requests" (status 429)
                if hasattr(batch_e, 'status') and batch_e.status == 429:
                    print("Erreur 429 (Too Many Requests). Attente de 60 secondes avant de réessayer ce lot...")
                    time.sleep(60) # Attente plus longue en cas de 429
                    try:
                        pinecone_index.upsert_records("", batch)
                        print(f"Lot {i//batch_size + 1} (après retry) envoyé avec succès.")
                    except Exception as retry_e:
                        print(f"Échec du retry pour le lot {i//batch_size + 1}: {retry_e}. Passage au lot suivant.")
                        continue # On pourrait aussi choisir de stopper tout le script ici
                else:
                    # Pour les autres erreurs, on pourrait vouloir stopper ou juste logguer et continuer
                    print(f"Erreur non-429, passage au lot suivant pour le moment.")
                    continue 
            
            # Temporisation avant le prochain lot pour ne pas surcharger l'API
            if (i + batch_size) < len(records_to_upsert): # Ne pas dormir après le dernier lot
                print(f"Attente de {sleep_duration_seconds:.1f} secondes avant le prochain lot...")
                time.sleep(sleep_duration_seconds)
        
        print(f"Upsert_records vers Pinecone '{PINECONE_INDEX_NAME}' terminé.")
        print(f"Nouvelles stats de l'index: {pinecone_index.describe_index_stats()}")

    except Exception as e:
        print(f"Erreur majeure lors de l'interaction avec Pinecone (natif): {e}")
        print("Veuillez vérifier vos identifiants Pinecone, le nom de l'index, la configuration réseau, et que l'index est bien configuré pour l'embedding intégré.")

# --- Exécution du Pipeline ---
def main():
    print(f"Démarrage du pipeline de création de vectorstore pour Pinecone uniquement...")
    print(f"Documents sources depuis: {LONG_FILES_DIR}")

    md_files = list(LONG_FILES_DIR.glob("*.md"))
    if not md_files:
        print(f"Aucun fichier .md trouvé dans {LONG_FILES_DIR}. Vérifiez que l'étape de prétraitement a bien fonctionné.")
        return
    print(f"Trouvé {len(md_files)} fichiers markdown à traiter.")

    documents_data = [] 
    for md_file in tqdm(md_files, desc="Chargement des documents Markdown"):
        doc_data = load_md_with_metadata(md_file)
        documents_data.append(doc_data)

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000, 
        chunk_overlap=200,
        length_function=len,
    )

    langchain_chunks = []
    for doc_data in tqdm(documents_data, desc="Division en chunks Langchain"):
        split_docs = text_splitter.create_documents(
            texts=[doc_data["content"]],
            metadatas=[doc_data["metadata"]]
        )
        langchain_chunks.extend(split_docs)
    
    print(f"Créé {len(langchain_chunks)} chunks de texte (objets Document Langchain) pour Pinecone.")

    # Supprimé : Partie Chroma
    # if OPENAI_API_KEY:
    #     print("\n--- Préparation pour Chroma (Embeddings OpenAI) ---")
    #     openai_embeddings = OpenAIEmbeddings(openai_api_key=OPENAI_API_KEY, model="text-embedding-ada-002")
    #     create_local_chroma_vectorstore(langchain_chunks, openai_embeddings)
    # else:
    #     print("\n--- Clé API OpenAI manquante, l'étape Chroma est sautée. ---")

    # Uniquement Upsert vers Pinecone
    upsert_to_pinecone_native(langchain_chunks)
    
    print("\nPipeline de création de vectorstore Pinecone terminé.")

if __name__ == "__main__":
    main() 