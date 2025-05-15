"""Advanced RAG implementation with support for multiple LLM providers and reranking."""

import time
import logging
import json
from typing import Dict, List, Any, Optional

from langchain_core.documents import Document

from .config import Config
from .embeddings import initialize_embeddings
from .vectorstore import initialize_vectorstore
from .retrieval import (initialize_retrievers, initialize_reranker, retrieve_documents, format_sources, collect_source_metadata)
from .llm import (initialize_llm, generate_answer, evaluate_sources_function, generate_answer_stream)
from .prompts import initialize_prompts
from .logging_utils import SessionLogger

class AdvancedRAG:
    """Advanced RAG implementation with support for reranking and source evaluation."""
    
    def __init__(self):
        self.embeddings = initialize_embeddings()
        self.vectorstore = initialize_vectorstore(self.embeddings)
        self.llm = initialize_llm(streaming=False)
        self.retrievers = initialize_retrievers(self.vectorstore, self.llm)
        self.reranker_compressor = initialize_reranker()
        self.answer_prompt, self.source_evaluation_prompt = initialize_prompts()
        
        self.logger = SessionLogger()
        
        logging.info(f"AdvancedRAG initialized with session ID: {self.logger.get_session_id()}")
    
    def answer_question(
        self,
        question: str,
        *,
        use_reranker: bool = False,
        use_multi_query: bool = False,
        evaluate_sources: bool = False,
        model: Optional[str] = None,
        temperature: float = 1.0,
        top_p: Optional[float] = None,
        top_k: Optional[int] = None,
        frequency_penalty: Optional[float] = None,
        presence_penalty: Optional[float] = None,
        repetition_penalty: Optional[float] = None,
        seed: Optional[int] = None,
        max_tokens: Optional[int] = None,
        k: Optional[int] = None,
        rerank_k: Optional[int] = None,
    ) -> Dict[str, Any]:
        total_start_time = time.time()
        model_used = model if model and model in Config.AVAILABLE_MODELS else Config.DEFAULT_MODEL
        flags_used = {
            "use_reranker": use_reranker,
            "use_multi_query": use_multi_query,
            "evaluate_sources": evaluate_sources,
            "model": model_used,
            "temperature": temperature,
            "top_p": top_p,
            "top_k": top_k,
            "frequency_penalty": frequency_penalty,
            "presence_penalty": presence_penalty,
            "repetition_penalty": repetition_penalty,
            "seed": seed,
            "max_tokens": max_tokens,
            "k": k,
            "rerank_k": rerank_k,
        }
        logging.info(f"--- Starting answer_question for: '{question[:50]}...' (Flags: {flags_used}) ---")

        # Initialize token metrics
        token_metrics = {
            "prompt_tokens": 0,
            "completion_tokens": 0,
            "total_tokens": 0,
            "cost": 0.0
        }

        # Step 1: Document Retrieval
        try:
            # Si l'utilisateur a fourni des valeurs k personnalisées, créez des retrieveurs temporaires
            if k is not None or rerank_k is not None:
                # Sauvegarder les valeurs originales
                original_k = Config.DEFAULT_K
                original_rerank_k = Config.RERANK_K

                # Appliquer les valeurs temporaires
                if k is not None:
                    Config.DEFAULT_K = k
                    logging.info(f"DEBUG: Temporarily set Config.DEFAULT_K to {Config.DEFAULT_K}")
                if rerank_k is not None:
                    Config.RERANK_K = rerank_k
                    logging.info(f"DEBUG: Temporarily set Config.RERANK_K to {Config.RERANK_K}")

                # Réinitialiser les retrieveurs avec les nouvelles valeurs
                temp_retrievers = initialize_retrievers(self.vectorstore, self.llm)

                docs, retrieval_duration, retriever_used = retrieve_documents(
                    question,
                    temp_retrievers,
                    self.reranker_compressor,
                    use_reranker,
                    use_multi_query=use_multi_query
                )

                # Restaurer les anciennes valeurs pour éviter les effets de bord
                Config.DEFAULT_K = original_k
                Config.RERANK_K = original_rerank_k
                logging.info(f"DEBUG: Restored Config.DEFAULT_K to {Config.DEFAULT_K}, Config.RERANK_K to {Config.RERANK_K}")
            else:
                docs, retrieval_duration, retriever_used = retrieve_documents(
                question, 
                self.retrievers,
                self.reranker_compressor, 
                use_reranker,
                use_multi_query=use_multi_query
            )
        except Exception as e:
            retrieval_duration = time.time() - total_start_time
            logging.exception(f"[Timing] Document retrieval failed after {retrieval_duration:.2f} seconds. Error: {e}")
            
            error_result = {
                "answer": "Error during document retrieval phase. Cannot proceed.",
                "source_evaluation": None,
                "sources": [],
                "processing_time": time.time() - total_start_time,
                "error": str(e),
                "flags": flags_used,
                "prompt_tokens": 0,
                "completion_tokens": 0,
                "total_tokens": 0,
                "cost": 0.0
            }
            
            self.logger.log_interaction(
                question=question, 
                answer=error_result['answer'], 
                sources=[], 
                evaluation=None, 
                processing_time=error_result['processing_time'],
                timing_breakdown={"retrieval_s": retrieval_duration}, 
                error=str(e), 
                flags=flags_used
            )
            
            return error_result

        # Step 2: Answer Generation
        # Si un modèle spécifique est demandé, initialiser un nouveau LLM avec la température spécifiée
        if model and model != Config.DEFAULT_MODEL:
            llm = initialize_llm(
                model=model,
                temperature=temperature,
                top_p=top_p,
                top_k=top_k,
                frequency_penalty=frequency_penalty,
                presence_penalty=presence_penalty,
                repetition_penalty=repetition_penalty,
                seed=seed,
                max_tokens=max_tokens,
                streaming=False,
            )
            logging.info(f"Using specific model for this generation: {model} (temperature={temperature})")
        else:
            # Utiliser le LLM par défaut mais avec la température spécifiée
            llm = initialize_llm(
                temperature=temperature,
                top_p=top_p,
                top_k=top_k,
                frequency_penalty=frequency_penalty,
                presence_penalty=presence_penalty,
                repetition_penalty=repetition_penalty,
                seed=seed,
                max_tokens=max_tokens,
                streaming=False,
            )
            logging.info(f"Using default model with temperature={temperature}")
            
        answer, answer_duration, answer_metrics = generate_answer(
            question=question, 
            docs=docs, 
            llm=llm,
            answer_prompt=self.answer_prompt
        )
        
        # Update token metrics
        token_metrics["prompt_tokens"] += answer_metrics["prompt_tokens"]
        token_metrics["completion_tokens"] += answer_metrics["completion_tokens"]
        token_metrics["total_tokens"] += answer_metrics["total_tokens"]
        token_metrics["cost"] += answer_metrics["cost"]

        # Step 3: Optional Source Evaluation
        source_evaluation = None
        evaluation_duration = 0.0
        
        if evaluate_sources and docs:
            formatted_sources = format_sources(docs)
            # Pour l'évaluation des sources, utiliser le même paramètre de température
            eval_llm = initialize_llm(
                temperature=temperature,
                top_p=top_p,
                top_k=top_k,
                frequency_penalty=frequency_penalty,
                presence_penalty=presence_penalty,
                repetition_penalty=repetition_penalty,
                seed=seed,
                max_tokens=max_tokens,
            )
            source_evaluation, evaluation_duration, eval_metrics = evaluate_sources_function(
                docs=docs, 
                question=question, 
                llm=eval_llm,
                source_evaluation_prompt=self.source_evaluation_prompt,
                formatted_sources=formatted_sources
            )
            
            # Update token metrics with evaluation metrics
            token_metrics["prompt_tokens"] += eval_metrics["prompt_tokens"]
            token_metrics["completion_tokens"] += eval_metrics["completion_tokens"]
            token_metrics["total_tokens"] += eval_metrics["total_tokens"]
            token_metrics["cost"] += eval_metrics["cost"]
            
        elif evaluate_sources:
            logging.warning("[Timing] Skipping source evaluation because no documents were retrieved.")
            source_evaluation = "Evaluation skipped: No documents retrieved."
        else:
            logging.info("[Timing] Skipping source evaluation (evaluate_sources=False).")

        # Step 4: Collect source metadata
        sources = collect_source_metadata(docs)

        # Calculate total processing time
        total_processing_time = time.time() - total_start_time

        # Step 5: Log the interaction
        self.logger.log_interaction(
            question=question, 
            answer=answer, 
            sources=sources, 
            evaluation=source_evaluation,
            processing_time=total_processing_time,
            timing_breakdown={
                "retrieval_s": retrieval_duration,
                "answer_generation_s": answer_duration,
                "source_evaluation_s": evaluation_duration
            },
            flags=flags_used
        )

        logging.info(f"--- Finished answer_question in {total_processing_time:.2f} seconds (Flags: {flags_used}) ---")
        logging.info(f"--- Total tokens: {token_metrics['total_tokens']} (Prompt: {token_metrics['prompt_tokens']}, Completion: {token_metrics['completion_tokens']}) ---")
        logging.info(f"--- Total cost: ${token_metrics['cost']:.6f} ---")

        # Return the final result with token metrics
        return {
            "answer": answer,
            "source_evaluation": source_evaluation,
            "sources": sources,
            "processing_time": total_processing_time,
            "model": model_used,
            "temperature": temperature,  # Inclure la température dans la réponse
            "prompt_tokens": token_metrics["prompt_tokens"],
            "completion_tokens": token_metrics["completion_tokens"],
            "total_tokens": token_metrics["total_tokens"],
            "cost": token_metrics["cost"]
        } 

    # ------------------------------------------------------------------
    # Streaming variant -------------------------------------------------
    # ------------------------------------------------------------------
    def answer_question_stream(
        self,
        question: str,
        *,
        use_reranker: bool = False,
        use_multi_query: bool = False,
        evaluate_sources: bool = False,
        model: Optional[str] = None,
        temperature: float = 1.0,
        top_p: Optional[float] = None,
        top_k: Optional[int] = None,
        frequency_penalty: Optional[float] = None,
        presence_penalty: Optional[float] = None,
        repetition_penalty: Optional[float] = None,
        seed: Optional[int] = None,
        max_tokens: Optional[int] = None,
        k: Optional[int] = None,
        rerank_k: Optional[int] = None,
    ):
        """Same as `answer_question` but streams the answer tokens.

        Yields successive chunks of the answer (strings). The caller can
        forward these via SSE / chunked HTTP response. All heavy lifting of
        retrieval is done upfront so that streaming is only for generation.
        
        Args:
            question: Question to answer
            use_reranker: Whether to use reranker
            use_multi_query: Whether to use multi-query
            evaluate_sources: Whether to evaluate sources
            model: Model to use
            temperature: Temperature parameter for the LLM (0.0-2.0)
        """
        model_used = model if model and model in Config.AVAILABLE_MODELS else Config.DEFAULT_MODEL
        flags_used = {
            "use_reranker": use_reranker,
            "use_multi_query": use_multi_query,
            "evaluate_sources": evaluate_sources,
            "model": model_used,
            "temperature": temperature,
            "top_p": top_p,
            "top_k": top_k,
            "frequency_penalty": frequency_penalty,
            "presence_penalty": presence_penalty,
            "repetition_penalty": repetition_penalty,
            "seed": seed,
            "max_tokens": max_tokens,
            "k": k,
            "rerank_k": rerank_k,
        }
        logging.info(f"--- Starting answer_question_stream for: '{question[:50]}...' (Flags: {flags_used}) ---")

        # Mark the start time to compute total processing duration later
        start_time = time.time()

        # 1. Retrieve documents (non-streaming, because retrieval is fast compared to generation)
        if k is not None or rerank_k is not None:
            original_k = Config.DEFAULT_K
            original_rerank_k = Config.RERANK_K

            if k is not None:
                Config.DEFAULT_K = k
            if rerank_k is not None:
                Config.RERANK_K = rerank_k if rerank_k is not None else (k or Config.RERANK_K)

            temp_retrievers = initialize_retrievers(self.vectorstore, self.llm)

            docs, _retrieval_duration, _ = retrieve_documents(
                question,
                temp_retrievers,
                self.reranker_compressor,
                use_reranker,
                use_multi_query=use_multi_query
            )

            Config.DEFAULT_K = original_k
            Config.RERANK_K = original_rerank_k
        else:
            docs, _retrieval_duration, _ = retrieve_documents(
            question,
            self.retrievers,
            self.reranker_compressor,
            use_reranker,
            use_multi_query=use_multi_query
        )

        # 2. Stream the answer generation
        # Initialize streaming LLM with temperature
        streaming_llm = initialize_llm(
            model=model,
            streaming=True,
            temperature=temperature,
            top_p=top_p,
            top_k=top_k,
            frequency_penalty=frequency_penalty,
            presence_penalty=presence_penalty,
            repetition_penalty=repetition_penalty,
            seed=seed,
            max_tokens=max_tokens,
        )
        
        stream_generator = generate_answer_stream(
            question=question,
            docs=docs,
            llm=streaming_llm,
            answer_prompt=self.answer_prompt
        )

        # Simply yield the chunks upstream; the Flask endpoint will be
        # responsible for wrapping them into SSE or another transport format.
        for chunk in stream_generator:
            yield chunk

        # 3. Emit metadata JSON at the end
        try:
            # Get token metrics from the streaming function
            token_metrics = getattr(generate_answer_stream, 'token_metrics', {
                "prompt_tokens": 0,
                "completion_tokens": 0,
                "total_tokens": 0,
                "cost": 0.0
            })
            
            sources_meta = collect_source_metadata(docs)
            metadata: Dict[str, Any] = {
                "type": "metadata",
                "sources": sources_meta,
                "processingTime": time.time() - start_time,
                "model": model_used,
                "temperature": temperature,  # Inclure la température dans les métadonnées
                "promptTokens": token_metrics["prompt_tokens"],
                "completionTokens": token_metrics["completion_tokens"],
                "totalTokens": token_metrics["total_tokens"],
                "cost": token_metrics["cost"]
            }

            # Optional source evaluation
            if evaluate_sources and docs:
                # Pour l'évaluation des sources, utiliser le même paramètre de température
                eval_llm = initialize_llm(
                    temperature=temperature,
                    top_p=top_p,
                    top_k=top_k,
                    frequency_penalty=frequency_penalty,
                    presence_penalty=presence_penalty,
                    repetition_penalty=repetition_penalty,
                    seed=seed,
                    max_tokens=max_tokens,
                )
                formatted_sources = format_sources(docs)
                evaluation_text, _, eval_metrics = evaluate_sources_function(
                    docs=docs,
                    question=question,
                    llm=eval_llm,
                    source_evaluation_prompt=self.source_evaluation_prompt,
                    formatted_sources=formatted_sources,
                )
                metadata["evaluation"] = evaluation_text
                
                # Add evaluation tokens and cost to the total
                metadata["promptTokens"] += eval_metrics["prompt_tokens"]
                metadata["completionTokens"] += eval_metrics["completion_tokens"]
                metadata["totalTokens"] += eval_metrics["total_tokens"]
                metadata["cost"] += eval_metrics["cost"]

            yield json.dumps(metadata)
            
            # Log total tokens and cost
            logging.info(f"--- Total tokens for streaming: {metadata['totalTokens']} (Prompt: {metadata['promptTokens']}, Completion: {metadata['completionTokens']}) ---")
            logging.info(f"--- Total cost for streaming: ${metadata['cost']:.6f} ---")
            
        except Exception as e:
            logging.exception(f"Failed to emit metadata: {e}") 