import os
import logging
from pathlib import Path
from typing import Optional, Dict, List
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path=Path(__file__).parent / ".env")

# Base paths
ROOT_DIR = Path(__file__).parent.parent  # Project root
BACKEND_DIR = Path(__file__).parent      # Backend directory

class Config:
    """Centralized configuration for the RAG system."""
    
    # Paths
    DATA_DIR: Path = BACKEND_DIR / "data"
    RAW_DIR: Path = DATA_DIR / "raw"
    PREPROCESSED_DIR: Path = DATA_DIR / "preprocessed"
    LONG_FILES_DIR: Path = PREPROCESSED_DIR / "long_files"
    SHORT_FILES_DIR: Path = PREPROCESSED_DIR / "short_files"
    VECTORSTORE_DIR: Path = DATA_DIR / "vectorstore"
    LOGS_DIR: Path = BACKEND_DIR / "logs"
    LOG_FILE: Path = LOGS_DIR / f"rag_session_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    
    # Module paths
    RAG_DIR: Path = BACKEND_DIR / "RAG"    # RAG components
    SCRIPTS_DIR: Path = BACKEND_DIR / "scripts"  # Scripts
    
    # API Keys
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    # Pinecone Configuration (ajouté)
    PINECONE_API_KEY: Optional[str] = os.getenv("PINECONE_API_KEY")
    PINECONE_ENVIRONMENT: Optional[str] = os.getenv("PINECONE_ENVIRONMENT", "us-east-1") # Défaut si non défini
    PINECONE_INDEX_NAME: Optional[str] = os.getenv("PINECONE_INDEX_NAME", "cyia")       # Défaut si non défini
    OPENROUTER_API_KEY: Optional[str] = os.getenv("OPENROUTER_API_KEY")
    COHERE_API_KEY: Optional[str] = os.getenv("COHERE_API_KEY")
    GOOGLE_API_KEY: Optional[str] = os.getenv("GOOGLE_API_KEY")
    MISTRAL_API_KEY: Optional[str] = os.getenv("MISTRAL_API_KEY")
    
    # Helicone Configuration
    HELICONE_API_KEY: Optional[str] = os.getenv("HELICONE_API_KEY")
    USE_HELICONE: bool = HELICONE_API_KEY is not None
    HELICONE_BASE_URL: str = "https://oai.hconeai.com/v1"
    HELICONE_HEADERS: Dict[str, str] = {
        "Helicone-Auth": f"Bearer {HELICONE_API_KEY}" if HELICONE_API_KEY else "",
        "Helicone-Cache-Enabled": "true",
        "Helicone-Property-Project": "cytech-rag",
    }
    
    # RAG Parameters
    DEFAULT_K: int = 20  # Default number of documents to retrieve without reranking
    # Choix du fournisseur de BDD vectorielle (ajouté)
    # Valeurs possibles: "Chroma", "Pinecone"
    BDD_PROVIDER: str = os.getenv("BDD_PROVIDER", "Chroma") 
    RERANK_K: int = 20  # Number of documents to retrieve *before* reranking
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gpt-4o")
    
    # OpenRouter Headers
    SITE_URL: str = os.getenv("YOUR_SITE_URL", "http://localhost:3000")
    APP_NAME: str = os.getenv("YOUR_APP_NAME", "AdvancedRAG App")
    
    # Reranker Model
    RERANKER_MODEL: str = "rerank-v3.5"
    
    # Modèles disponibles
    AVAILABLE_MODELS: Dict[str, Dict[str, str]] = {
        # OpenAI models
        "gpt-4o": {
            "name": "GPT-4o",
            "provider": "openai",
            "description": "Modèle le plus avancé d'OpenAI, équilibrant performance et coût"
        },
        "gpt-4-turbo": {
            "name": "GPT-4 Turbo",
            "provider": "openai",
            "description": "Version optimisée du GPT-4, plus rapide que l'original"
        },
        
        # Anthropic models
        "anthropic/claude-3.7-sonnet": {
            "name": "Claude 3.7 Sonnet",
            "provider": "anthropic",
            "description": "Modèle intermédiaire d'Anthropic, équilibrant performance et coût"
        },
        
        # Mistral models
        "mistralai/ministral-8b": {
            "name": "Mistral 8B (Ministral)",
            "provider": "mistralai",
            "description": "Modèle Mistral compact et rapide (Ministral 8B)"
        },
        
        # Google models - Identifiants corrects pour OpenRouter
        "google/gemini-2.0-flash-lite-001": {
            "name": "Gemini 2.0 Flash Lite",
            "provider": "google",
            "description": "Version économique du modèle Gemini 2.0 Flash"
        },
        
        # xAI models
        "x-ai/grok-3-mini-beta": {
            "name": "grok-3-mini-beta",
            "provider": "xai",
            "description": "Le premier modèle de xAI (Elon Musk), via OpenRouter"
        },
        
        # Nouveaux modèles OpenRouter
        "openai/gpt-4.1": {
            "name": "GPT-4.1",
            "provider": "openai",
            "description": "Modèle GPT-4.1 d'OpenAI avec capacités Vision"
        },
        "deepseek/deepseek-r1:free": {
            "name": "Deepseek R1",
            "provider": "deepseek",
            "description": "Modèle performant de Deepseek avec version gratuite"
        },
        "qwen/qwen-2.5-7b-instruct": {
            "name": "Qwen 2.5 7B",
            "provider": "qwen",
            "description": "Modèle économique de Qwen, bonne performance pour son coût"
        }
    }
    
    # Modèle par défaut
    DEFAULT_MODEL: str = "gpt-4o"

# Create necessary directories
Config.DATA_DIR.mkdir(exist_ok=True)
Config.RAW_DIR.mkdir(exist_ok=True)
Config.PREPROCESSED_DIR.mkdir(exist_ok=True)
Config.LONG_FILES_DIR.mkdir(exist_ok=True)
Config.SHORT_FILES_DIR.mkdir(exist_ok=True)
Config.LOGS_DIR.mkdir(exist_ok=True)
Config.VECTORSTORE_DIR.mkdir(exist_ok=True)

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def validate_environment() -> None:
    """Validate required environment variables and exit if critical ones are missing."""
    # OpenAI API key est requis si Chroma est utilisé (pour les embeddings), ou pour les appels LLM directs
    if Config.BDD_PROVIDER == "Chroma" and not Config.OPENAI_API_KEY:
        logging.critical("CRITICAL: OPENAI_API_KEY not found in .env file (required for Chroma embeddings). Exiting.")
        exit(1)
    elif not Config.OPENAI_API_KEY and not Config.OPENROUTER_API_KEY:
        # Si ni OpenAI ni OpenRouter n'est configuré pour le LLM, c'est un problème aussi
        logging.critical("CRITICAL: OPENAI_API_KEY or OPENROUTER_API_KEY must be set for LLM calls. Exiting.")
        exit(1)
    elif not Config.OPENAI_API_KEY:
        logging.info("OPENAI_API_KEY not provided. Assurez-vous que OPENROUTER_API_KEY est configuré pour les LLMs.")

    # Valider la configuration Pinecone si c'est le BDD_PROVIDER choisi
    if Config.BDD_PROVIDER == "Pinecone":
        if not all([Config.PINECONE_API_KEY, Config.PINECONE_ENVIRONMENT, Config.PINECONE_INDEX_NAME]):
            logging.critical(
                "CRITICAL: Configuration Pinecone incomplète (PINECONE_API_KEY, PINECONE_ENVIRONMENT, PINECONE_INDEX_NAME) "
                "lorsque BDD_PROVIDER est 'Pinecone'. Exiting."
            )
            exit(1)
        else:
            logging.info(f"Configuration Pinecone détectée: Index='{Config.PINECONE_INDEX_NAME}', Env='{Config.PINECONE_ENVIRONMENT}'.")
    
    # Warn if Cohere key is missing
    if not Config.COHERE_API_KEY:
        logging.warning("WARNING: COHERE_API_KEY not found in .env file. Reranking feature will be disabled.")

    # Log Helicone configuration status
    if Config.HELICONE_API_KEY:
        logging.info("Helicone API key found. Analytics and monitoring enabled.")
    else:
        logging.info("Helicone API key not found. Analytics and monitoring disabled.")
    
    # Valider le répertoire vectorstore uniquement si Chroma est utilisé
    if Config.BDD_PROVIDER == "Chroma":
        if not Config.VECTORSTORE_DIR.exists():
            logging.error(f"Répertoire Vectorstore Chroma non trouvé à {Config.VECTORSTORE_DIR}")
            logging.warning(f"AVERTISSEMENT: Répertoire Vectorstore Chroma non trouvé à {Config.VECTORSTORE_DIR}. L'initialisation de Chroma pourrait échouer.")

# Run validation during import
validate_environment() 