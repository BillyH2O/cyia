import os
import sys
from dotenv import load_dotenv
from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
import json
from tqdm import tqdm
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent.parent.parent))  

load_dotenv(dotenv_path=Path(__file__).parents[2] / ".env")

assert os.getenv("OPENAI_API_KEY"), "La clé API OpenAI n'a pas été trouvée dans le fichier .env"


ROOT_DIR = Path(__file__).parent.parent.parent.parent 
BACKEND_DIR = Path(__file__).parent.parent.parent  # backend/
DATA_DIR = BACKEND_DIR / "data"  # Mise à jour: data est maintenant dans backend/
PREPROCESSED_DIR = DATA_DIR / "preprocessed"
LONG_FILES_DIR = PREPROCESSED_DIR / "long_files"
VECTORSTORE_DIR = DATA_DIR / "vectorstore"  

def load_md_with_metadata(file_path):
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

def main():
    print(f"Création de l'index vectoriel à partir des documents prétraités dans {LONG_FILES_DIR}")
    
    # Créer le répertoire de l'index vectoriel s'il n'existe pas
    VECTORSTORE_DIR.mkdir(exist_ok=True, parents=True)
    
    # Collecter tous les fichiers markdown dans le répertoire des fichiers longs
    md_files = list(LONG_FILES_DIR.glob("*.md"))
    print(f"Trouvé {len(md_files)} fichiers markdown à traiter")
    
    # Charger les documents et leurs métadonnées
    documents = []
    for md_file in tqdm(md_files, desc="Chargement des documents"):
        doc_with_metadata = load_md_with_metadata(md_file)
        documents.append(doc_with_metadata)
    
    # Créer un text splitter pour diviser les documents en chunks
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=300,
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
    
    print(f"Créé {len(chunks)} chunks de texte à partir de {len(documents)} documents")
    
    # Créer les embeddings
    embeddings = OpenAIEmbeddings()
    
    # Créer l'index vectoriel
    print("Création de l'index vectoriel...")
    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=str(VECTORSTORE_DIR)
    )
    
    # Sauvegarder l'index vectoriel
    vectorstore.persist()
    print(f"Index vectoriel créé et sauvegardé dans {VECTORSTORE_DIR}")

if __name__ == "__main__":
    main() 