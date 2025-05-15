import logging
from langchain_openai import OpenAIEmbeddings
from .config import Config

def initialize_embeddings():
    try:
        # Paramètres de base
        embedding_kwargs = {
            "model": "text-embedding-3-small",
            "dimensions": 1536,  # Dimensionnalité des embeddings
        }
        
        if Config.USE_HELICONE:
            # Créer une copie des en-têtes Helicone standard
            helicone_headers = Config.HELICONE_HEADERS.copy()
            
            # Ajouter des propriétés spécifiques pour les embeddings
            helicone_headers.update({
                "Helicone-Property-Service": "embeddings",
                "Helicone-Property-Model": "text-embedding-3-small",
                "Helicone-Property-Type": "vector-embedding",
                "Helicone-Property-Request-From": "RAG-system"
            })
            
            embedding_kwargs.update({
                "base_url": Config.HELICONE_BASE_URL,
                "default_headers": helicone_headers,
                "api_key": Config.OPENAI_API_KEY,
            })
            logging.info("Initializing embeddings with Helicone integration")
        
        embeddings = OpenAIEmbeddings(**embedding_kwargs)
        logging.info(f"Embeddings initialized successfully (dimension: {embedding_kwargs['dimensions']})")
        return embeddings
    except Exception as e:
        logging.exception(f"Error initializing embeddings: {e}")
        raise 