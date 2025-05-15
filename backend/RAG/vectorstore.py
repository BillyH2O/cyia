import logging
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
from .config import Config

def initialize_vectorstore(embeddings: OpenAIEmbeddings) -> Chroma:
    logging.info(f"Loading vector store from {Config.VECTORSTORE_DIR}...")
    vectorstore = Chroma(
        persist_directory=str(Config.VECTORSTORE_DIR),
        embedding_function=embeddings
    )
    logging.info("Vector store loaded successfully.")
    return vectorstore 