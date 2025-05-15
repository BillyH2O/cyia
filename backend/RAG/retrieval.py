import logging
import time
from typing import List, Tuple, Any, Optional, Dict
from langchain_community.vectorstores import Chroma
from langchain.retrievers import ContextualCompressionRetriever
from langchain.retrievers.multi_query import MultiQueryRetriever
from langchain_core.documents import Document
from langchain_cohere import CohereRerank
from langchain_openai import ChatOpenAI
from .config import Config

def initialize_retrievers(vectorstore: Chroma, llm: ChatOpenAI) -> Dict[str, Any]:
    # Base retriever for initial fetch (used directly if no reranking)
    base_retriever = vectorstore.as_retriever(
        search_kwargs={"k": Config.DEFAULT_K} 
    )
    
    # Retriever used *before* reranking (fetches more documents)
    logging.info(f"DEBUG: Initializing rerank_base_retriever, current Config.RERANK_K = {Config.RERANK_K}")
    rerank_base_retriever = vectorstore.as_retriever(
        search_kwargs={"k": Config.RERANK_K}
    )
    
    # Multi-query retriever
    multi_query_retriever = MultiQueryRetriever.from_llm(
        retriever=base_retriever,
        llm=llm,
    )
    
    logging.info(f"Base retriever initialized (k={Config.DEFAULT_K}), "
                f"Rerank base retriever initialized (k={Config.RERANK_K}), "
                f"Multi-query retriever initialized.")
    
    return {
        "base": base_retriever,
        "rerank_base": rerank_base_retriever,
        "multi_query": multi_query_retriever,
    }

def initialize_reranker() -> Optional[CohereRerank]:
    if Config.COHERE_API_KEY:
        try:
            reranker = CohereRerank(
                model=Config.RERANKER_MODEL, 
                top_n=Config.DEFAULT_K
            )
            logging.info("Cohere Reranker initialized.")
            return reranker
        except Exception as e:
            logging.error(f"Failed to initialize Cohere Reranker: {e}. Reranking will be disabled.")
            return None
    else:
        logging.info("Cohere Reranker not initialized (API key missing).")
        return None

def retrieve_documents(
    question: str, 
    retrievers: Dict[str, Any],
    reranker_compressor: Optional[CohereRerank], 
    use_reranker: bool,
    use_multi_query: bool
) -> Tuple[List[Document], float, str]:
    retrieval_start_time = time.time()
    retriever_used = "Unknown"
    
    if use_reranker and reranker_compressor:
        logging.info(f"[Timing] Starting retrieval for reranking (k={Config.RERANK_K})...")
        retriever_used = "Rerank Base Retriever + Compression Retriever"
        
        compression_retriever = ContextualCompressionRetriever(
            base_compressor=reranker_compressor,
            base_retriever=retrievers["rerank_base"]
        )
        
        docs = compression_retriever.get_relevant_documents(question)
    elif use_multi_query:
        retriever_used = "Multi-Query Retriever"
        logging.info(f"[Timing] Starting multi-query document retrieval (k={Config.DEFAULT_K})...")
        docs = retrievers["multi_query"].get_relevant_documents(question)
    else:
        retriever_used = "Base Retriever"
        logging.info(f"[Timing] Starting standard document retrieval (k={Config.DEFAULT_K})...")
        docs = retrievers["base"].get_relevant_documents(question)
        
        if use_reranker and not reranker_compressor:
            logging.warning("Reranker was requested but is not available. Falling back to standard retrieval.")
    
    retrieval_duration = time.time() - retrieval_start_time
    logging.info(f"[Timing] Document retrieval finished in {retrieval_duration:.2f} seconds. Found {len(docs)} documents.")
    
    return docs, retrieval_duration, retriever_used

def format_sources(docs: List[Document]) -> str:
    sources = []
    for i, doc in enumerate(docs):
        source_info = f"Source {i+1}:\n"
        source_info += f"Titre: {doc.metadata.get('title', 'Non disponible')}\n"
        source_info += f"URL: {doc.metadata.get('url', 'Non disponible')}\n"
        source_info += f"Contenu: {doc.page_content[:200]}...\n"
        sources.append(source_info)
    return "\n".join(sources)

def collect_source_metadata(docs: List[Document]) -> List[dict]:
    sources = []
    for doc in docs:
        source = {
            "content": doc.page_content[:300] + "..." if len(doc.page_content) > 300 else doc.page_content,
            "metadata": doc.metadata
        }
        sources.append(source)
    return sources 