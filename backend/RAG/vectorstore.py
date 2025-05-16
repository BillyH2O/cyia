import logging
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
from .config import Config
from langchain_pinecone import Pinecone as LangchainPinecone 
from typing import Union
from langchain_core.embeddings import Embeddings

class NoOpEmbeddings(Embeddings):
    """Classe d'embedding fictive qui ne fait rien, si Langchain l'exige pour un index à embedding intégré."""
    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        logging.warning("NoOpEmbeddings.embed_documents a été appelé - ceci est inattendu pour un index Pinecone à embedding intégré.")
        return [[0.0] * 1024 for _ in texts] # Dimension de llama-text-embed-v2 pour 'cyia'

    def embed_query(self, text: str) -> List[float]:
        logging.warning("NoOpEmbeddings.embed_query a été appelé - ceci est inattendu.")
        return [0.0] * 1024

def initialize_vectorstore(embeddings_for_chroma: OpenAIEmbeddings) -> Union[Chroma, LangchainPinecone]:
    """Initialise et retourne le vectorstore configuré (Chroma ou Pinecone)."""
    
    provider = Config.BDD_PROVIDER
    logging.info(f"Initialisation du vectorstore avec le fournisseur : {provider}")

    if provider == "Pinecone":
        if not Config.PINECONE_API_KEY or not Config.PINECONE_ENVIRONMENT or not Config.PINECONE_INDEX_NAME:
            logging.error("Configuration Pinecone incomplète. Vérifiez PINECONE_API_KEY, PINECONE_ENVIRONMENT, et PINECONE_INDEX_NAME.")
            raise ValueError("Configuration Pinecone incomplète.")

        logging.info(f"Initialisation de LangchainPinecone: Index='{Config.PINECONE_INDEX_NAME}'.")
        
        try:
            '''Pour un index avec embedding intégré comme 'cyia' (modèle llama-text-embed-v2, champ 'text'),
            # nous ne devons PAS fournir notre propre `OpenAIEmbeddings` à LangchainPinecone.
            # LangchainPinecone devrait être capable d'utiliser l'embedding intégré si on ne lui passe pas d'objet `embedding`
            # ou si on lui passe un objet embedding spécial / None et le `text_key`.
            # La documentation de langchain-pinecone suggère d'omettre `embedding` ou d'utiliser un embedding
            # qui ne fait rien si le modèle est côté serveur.
            
            # Tentative 1: Omettre `embedding` et espérer que `text_key` (si supporté/nécessaire) soit géré.
            # `from_existing_index` requiert un paramètre `embedding`.
            # On va donc utiliser `NoOpEmbeddings` pour satisfaire la signature, tout en indiquant à Pinecone
            # d'utiliser son embedding intégré via la configuration de l'index (`text_key` implicite ou via `field_map`).
            # Le `text_key` important est celui défini lors de la création de l'index Pinecone (`llama-text-embed-v2` sur le champ `text`).
            
            # L'objet `embeddings_for_chroma` (OpenAI) ne sera pas utilisé ici.
            # On passe un NoOpEmbeddings pour que Langchain ne tente pas d'utiliser OpenAI pour Pinecone.
            # La dimension de NoOpEmbeddings est mise à 1024 pour correspondre à llama-text-embed-v2.'''
            noop_embeddings = NoOpEmbeddings()

            pinecone_vectorstore = LangchainPinecone.from_existing_index(
                index_name=Config.PINECONE_INDEX_NAME,
                embedding=noop_embeddings, # Passe un objet embedding qui ne fera rien.
                # text_key="text" # Normalement géré par la config de l'index Pinecone lui-même.
                                  # Ajouter si des erreurs indiquent que Langchain ne trouve pas le champ texte.
            )
            logging.info(f"Connecté à l'index Pinecone existant '{Config.PINECONE_INDEX_NAME}' via LangchainPinecone.")
            return pinecone_vectorstore
        except Exception as e:
            logging.exception(f"Erreur lors de l'initialisation de LangchainPinecone pour l'index '{Config.PINECONE_INDEX_NAME}': {e}")
            raise

    elif provider == "Chroma":
        logging.info(f"Chargement du vectorstore Chroma depuis {Config.VECTORSTORE_DIR}...")
        if not Config.VECTORSTORE_DIR.exists():
            logging.error(f"Le répertoire du vectorstore Chroma {Config.VECTORSTORE_DIR} n'existe pas.")
            raise FileNotFoundError(f"Répertoire Chroma non trouvé: {Config.VECTORSTORE_DIR}")
        
        vectorstore = Chroma(
            persist_directory=str(Config.VECTORSTORE_DIR),
            embedding_function=embeddings_for_chroma # Chroma utilise les embeddings OpenAI ici
        )
        logging.info("Vectorstore Chroma chargé avec succès.")
        return vectorstore
    
    else:
        logging.error(f"Fournisseur BDD inconnu : {provider}. Choix valides : 'Chroma', 'Pinecone'.")
        raise ValueError(f"Fournisseur BDD non supporté : {provider}") 