import logging
import time
import tiktoken
from typing import Tuple, List, Any, Optional, Dict
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.schema.output_parser import StrOutputParser
from langchain_core.documents import Document
from .config import Config

# Constants for token cost calculation - updated as of July 2024
MODEL_COSTS = {
    # OpenAI models
    "gpt-4o": {"input_cost": 0.000005, "output_cost": 0.000015},  # $5/M input, $15/M output
    "gpt-4-turbo": {"input_cost": 0.00001, "output_cost": 0.00003},  # $10/M input, $30/M output
    
    # Anthropic models through OpenRouter
    "anthropic/claude-3.7-sonnet": {"input_cost": 0.000003, "output_cost": 0.000015},  # $3/M input, $15/M output
    
    # Mistral models through OpenRouter 
    "mistral/ministral-8b": {"input_cost": 0.0000008, "output_cost": 0.0000024},  # $0.80/M input, $2.40/M output
    
    # Google models through OpenRouter
    "google/gemini-2.0-flash-lite-001": {"input_cost": 0.000001, "output_cost": 0.000002},  # $1/M input, $2/M output
    
    # xAI models through OpenRouter
    "x-ai/grok-3-mini-beta": {"input_cost": 0.000001, "output_cost": 0.000003},  # $1/M input, $3/M output
    
    # Nouveaux modèles OpenRouter
    "openai/gpt-4.1": {"input_cost": 0.00001, "output_cost": 0.00003},  # $10/M input, $30/M output
    "deepseek/deepseek-r1:free": {"input_cost": 0.0, "output_cost": 0.0},  # Gratuit
    "qwen/qwen-2.5-7b-instruct": {"input_cost": 0.0000007, "output_cost": 0.0000007}  # $0.70/M input, $0.70/M output
}

def get_helicone_headers(model_id: str, provider: str, source: str = "openai") -> Dict[str, str]:
    """Génère les en-têtes Helicone standard pour un appel API."""
    if not Config.USE_HELICONE:
        return {}
        
    helicone_headers = Config.HELICONE_HEADERS.copy() if hasattr(Config, "HELICONE_HEADERS") else {}
    helicone_headers.update({
        "Helicone-Auth": f"Bearer {Config.HELICONE_API_KEY}",
        "Helicone-Cache-Enabled": "true",
        "Helicone-Property-Project": "cytech-rag",
        "Helicone-Property-Service": "chat",
        "Helicone-Property-Model": model_id,
        "Helicone-Property-Provider": provider,
        "Helicone-Property-Source": source,
        "Helicone-Property-Request-From": "RAG-system",
        "Helicone-Property-Type": "completion"
    })
    
    return helicone_headers

def count_tokens(text: str, model: str = "gpt-4o") -> int:
    """Count tokens for a given text using the appropriate tokenizer."""
    try:
        if "gpt" in model:
            # For OpenAI models
            encoding = tiktoken.encoding_for_model(model)
            return len(encoding.encode(text))
        else:
            # For non-OpenAI models, use cl100k_base as a reasonable approximation
            encoding = tiktoken.get_encoding("cl100k_base")
            return len(encoding.encode(text))
    except Exception as e:
        logging.warning(f"Error counting tokens: {e}. Using approximate token count.")
        # Fallback: rough estimate based on words (approx 4 chars per token)
        return len(text) // 4

def calculate_cost(prompt_tokens: int, completion_tokens: int, model: str = "gpt-4o") -> float:
    """Calculate the cost of a request based on token counts and model."""
    model_key = model
    
    # Handle model keys for providers through OpenRouter
    for key in MODEL_COSTS:
        if key in model or model in key:
            model_key = key
            break
    
    # Use default costs if model not found
    if model_key not in MODEL_COSTS:
        logging.warning(f"Cost data not available for model {model}. Using gpt-4o pricing.")
        model_key = "gpt-4o"
    
    costs = MODEL_COSTS[model_key]
    
    prompt_cost = prompt_tokens * costs["input_cost"]
    completion_cost = completion_tokens * costs["output_cost"]
    
    return prompt_cost + completion_cost

def initialize_openai_llm(
    model_id: str,
    *,
    streaming: bool = False,
    temperature: float = 1.0,
    top_p: Optional[float] = None,
    top_k: Optional[int] = None,
    frequency_penalty: Optional[float] = None,
    presence_penalty: Optional[float] = None,
    repetition_penalty: Optional[float] = None,
    seed: Optional[int] = None,
    max_tokens: Optional[int] = None,
) -> ChatOpenAI:
    """Initialise un LLM OpenAI, en transmettant les paramètres d'échantillonnage facultatifs."""
    openai_kwargs: Dict[str, Any] = {
        "model": model_id,
        "temperature": temperature,
    }
    # Ajout des paramètres optionnels s'ils sont fournis (différent de None)
    if top_p is not None:
        openai_kwargs["top_p"] = top_p
    if frequency_penalty is not None:
        openai_kwargs["frequency_penalty"] = frequency_penalty
    if presence_penalty is not None:
        openai_kwargs["presence_penalty"] = presence_penalty
    if seed is not None:
        openai_kwargs["seed"] = seed
    if max_tokens is not None:
        openai_kwargs["max_tokens"] = max_tokens

    if streaming:
        openai_kwargs["streaming"] = True
    
    if Config.USE_HELICONE:
        helicone_headers = get_helicone_headers(model_id, "openai", "direct")
        openai_kwargs.update({
            "base_url": Config.HELICONE_BASE_URL,
            "default_headers": helicone_headers,
            "api_key": Config.OPENAI_API_KEY,
        })
        logging.info(f"OpenAI LLM initialized with Helicone integration for model {model_id} (temperature={temperature})")
    else:
        openai_kwargs["api_key"] = Config.OPENAI_API_KEY
        logging.info(f"OpenAI LLM initialized directly (no Helicone) for model {model_id} (temperature={temperature})")
    
    # OpenAI API does not support top_k or repetition_penalty; skip them with a warning
    if top_k is not None:
        logging.info("top_k is not supported by OpenAI ChatCompletion API; parameter skipped.")
    if repetition_penalty is not None:
        logging.info("repetition_penalty is not supported by OpenAI ChatCompletion API; parameter skipped.")
    
    return ChatOpenAI(**openai_kwargs)

def initialize_openrouter_llm(
    model_id: str,
    provider: str,
    *,
    streaming: bool = False,
    temperature: float = 1.0,
    top_p: Optional[float] = None,
    top_k: Optional[int] = None,
    frequency_penalty: Optional[float] = None,
    presence_penalty: Optional[float] = None,
    repetition_penalty: Optional[float] = None,
    seed: Optional[int] = None,
    max_tokens: Optional[int] = None,
) -> ChatOpenAI:
    """Initialise un LLM via OpenRouter."""
    # En-têtes de base pour OpenRouter
    openrouter_headers = {
        "HTTP-Referer": Config.SITE_URL,
        "X-Title": Config.APP_NAME
    }
    
    # Ajouter Helicone si configuré
    if Config.USE_HELICONE:
        helicone_headers = get_helicone_headers(model_id, provider, "openrouter")
        openrouter_headers.update(helicone_headers)
        logging.info(f"OpenRouter headers enhanced with Helicone for model {model_id}")
        
        # Utiliser la passerelle Helicone pour OpenRouter
        base_url = "https://openrouter.helicone.ai/api/v1"
    else:
        # Endpoint OpenRouter direct
        base_url = "https://openrouter.ai/api/v1"
    
    llm_kwargs: Dict[str, Any] = {
        "model": model_id,
        "base_url": base_url,
        "api_key": Config.OPENROUTER_API_KEY,
        "default_headers": openrouter_headers,
        "temperature": temperature,
    }
    if streaming:
        llm_kwargs["streaming"] = True
    if top_p is not None:
        llm_kwargs["top_p"] = top_p
    if frequency_penalty is not None:
        llm_kwargs["frequency_penalty"] = frequency_penalty
    if presence_penalty is not None:
        llm_kwargs["presence_penalty"] = presence_penalty
    if seed is not None:
        llm_kwargs["seed"] = seed
    if max_tokens is not None:
        llm_kwargs["max_tokens"] = max_tokens
    
    # Provider-specific params to be forwarded via model_kwargs
    extra_params: Dict[str, Any] = {}
    if top_k is not None:
        extra_params["top_k"] = top_k
    if repetition_penalty is not None:
        extra_params["repetition_penalty"] = repetition_penalty
    if extra_params:
        llm_kwargs["extra_body"] = extra_params

    llm = ChatOpenAI(**llm_kwargs)
    
    logging.info(f"OpenRouter LLM initialized for model {model_id} via {base_url} (temperature={temperature})")
    return llm

def initialize_llm(
    model: Optional[str] = None,
    *,
    streaming: bool = False,
    temperature: float = 1.0,
    top_p: Optional[float] = None,
    top_k: Optional[int] = None,
    frequency_penalty: Optional[float] = None,
    presence_penalty: Optional[float] = None,
    repetition_penalty: Optional[float] = None,
    seed: Optional[int] = None,
    max_tokens: Optional[int] = None,
) -> ChatOpenAI:
    """Initialise le LLM approprié selon le modèle demandé et la configuration.
    
    Args:
        model: Identifiant du modèle à utiliser, si None utilise le modèle par défaut
        streaming: Si True, initialise le LLM en mode streaming
        temperature: Valeur de température pour le modèle (0.0 - 2.0), défaut 1.0
        
    Returns:
        Une instance de LLM configurée
    """
    # Déterminer le modèle à utiliser
    model_id = model if model and model in Config.AVAILABLE_MODELS else Config.DEFAULT_MODEL
    
    # Vérifier si le modèle demandé est disponible
    if model and model not in Config.AVAILABLE_MODELS:
        logging.warning(f"Le modèle '{model}' n'est pas disponible. Utilisation du modèle par défaut: {Config.DEFAULT_MODEL}")
        model_id = Config.DEFAULT_MODEL
    
    # Récupérer le fournisseur du modèle
    provider = Config.AVAILABLE_MODELS.get(model_id, {}).get("provider", "")
    
    # Déterminer s'il faut utiliser OpenRouter
    use_openrouter = Config.OPENROUTER_API_KEY and (
        provider in ["anthropic", "google", "mistral", "xai", "deepseek", "qwen"] or  
        any(key in model_id for key in ["claude", "gemini", "mistral", "grok", "deepseek", "qwen"])
    )
    
    # Initialiser le bon type de LLM
    if use_openrouter:
        logging.info(f"Using OpenRouter for model {model_id} (provider: {provider})")
        return initialize_openrouter_llm(
            model_id,
            provider,
            streaming=streaming,
            temperature=temperature,
            top_p=top_p,
            top_k=top_k,
            frequency_penalty=frequency_penalty,
            presence_penalty=presence_penalty,
            repetition_penalty=repetition_penalty,
            seed=seed,
            max_tokens=max_tokens,
        )
    else:
        logging.info(f"Using OpenAI directly for model {model_id}")
        return initialize_openai_llm(
            model_id,
            streaming=streaming,
            temperature=temperature,
            top_p=top_p,
            top_k=top_k,
            frequency_penalty=frequency_penalty,
            presence_penalty=presence_penalty,
            repetition_penalty=repetition_penalty,
            seed=seed,
            max_tokens=max_tokens,
        )

def generate_answer(question: str, docs: List[Document], llm: ChatOpenAI, answer_prompt: ChatPromptTemplate) -> Tuple[str, float, Dict[str, Any]]:
    """Génère une réponse à partir d'une question et de documents de contexte."""
    answer_start_time = time.time()
    token_metrics = {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0, "cost": 0.0}
    model_id = llm.model_name  # Récupérer le nom du modèle directement depuis l'instance LLM
    
    try:
        logging.info("[Timing] Starting answer generation...")
        if not docs:
            logging.warning("No documents found or provided for context. Answer quality may be poor.")
            
        context_string = "\n\n".join([doc.page_content for doc in docs]) if docs else "No context available."
        
        # Count tokens in the prompt
        formatted_prompt = answer_prompt.format(context=context_string, question=question)
        prompt_tokens = count_tokens(formatted_prompt, model_id)
        token_metrics["prompt_tokens"] = prompt_tokens
        
        # Generate the answer
        answer_chain = (answer_prompt | llm | StrOutputParser())
        answer = answer_chain.invoke({"context": context_string, "question": question})
        
        # Count tokens in the response
        completion_tokens = count_tokens(answer, model_id)
        token_metrics["completion_tokens"] = completion_tokens
        token_metrics["total_tokens"] = prompt_tokens + completion_tokens
        
        # Calculate cost
        token_metrics["cost"] = calculate_cost(prompt_tokens, completion_tokens, model_id)
        
        answer_duration = time.time() - answer_start_time
        logging.info(f"[Timing] Answer generation finished in {answer_duration:.2f} seconds.")
        logging.info(f"[Tokens] Prompt: {prompt_tokens}, Completion: {completion_tokens}, Total: {token_metrics['total_tokens']}")
        logging.info(f"[Cost] ${token_metrics['cost']:.6f}")
        
        return answer, answer_duration, token_metrics
    except Exception as e:
        answer_duration = time.time() - answer_start_time
        logging.exception(f"[Timing] Answer generation failed after {answer_duration:.2f} seconds. Error: {e}")
        return f"Error during answer generation: {e}", answer_duration, token_metrics

def evaluate_sources_function(docs: List[Document], question: str, llm: ChatOpenAI, 
                    source_evaluation_prompt: ChatPromptTemplate, formatted_sources: str) -> Tuple[str, float, Dict[str, Any]]:
    """Évalue la qualité et la pertinence des sources pour une question donnée."""
    eval_start_time = time.time()
    token_metrics = {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0, "cost": 0.0}
    model_id = getattr(llm, 'model', Config.DEFAULT_MODEL)
    
    if not docs:
        logging.warning("Skipping source evaluation: No documents provided.")
        return "Aucune source n'a été trouvée pour répondre à cette question.", 0.0, token_metrics
    
    try:
        # Count tokens in the prompt
        formatted_prompt = source_evaluation_prompt.format(sources=formatted_sources, question=question)
        prompt_tokens = count_tokens(formatted_prompt, model_id)
        token_metrics["prompt_tokens"] = prompt_tokens
        
        evaluation_chain = (
            source_evaluation_prompt 
            | llm
            | StrOutputParser()
        )
        
        evaluation = evaluation_chain.invoke({
            "sources": formatted_sources,
            "question": question
        })
        
        # Count tokens in the response
        completion_tokens = count_tokens(evaluation, model_id)
        token_metrics["completion_tokens"] = completion_tokens
        token_metrics["total_tokens"] = prompt_tokens + completion_tokens
        
        # Calculate cost
        token_metrics["cost"] = calculate_cost(prompt_tokens, completion_tokens, model_id)
        
        eval_duration = time.time() - eval_start_time
        logging.info(f"[Timing] Source evaluation finished in {eval_duration:.2f} seconds.")
        logging.info(f"[Tokens] Eval Prompt: {prompt_tokens}, Completion: {completion_tokens}, Total: {token_metrics['total_tokens']}")
        logging.info(f"[Cost] Eval ${token_metrics['cost']:.6f}")
        
        return evaluation, eval_duration, token_metrics
    except Exception as e:
        eval_duration = time.time() - eval_start_time
        logging.error(f"[Timing] Source evaluation failed after {eval_duration:.2f} seconds. Error: {e}")
        return f"Error during source evaluation: {e}", eval_duration, token_metrics

def generate_answer_stream(question: str, docs: List[Document], llm: ChatOpenAI, answer_prompt: ChatPromptTemplate):
    """Generate an answer in a streaming fashion, yielding partial strings."""
    model_id = llm.model_name  # Récupérer le nom du modèle directement depuis l'instance LLM

    if not docs:
        logging.warning("No documents found or provided for context. Answer quality may be poor.")

    # Add token counting before streaming
    context_string = "\n\n".join([doc.page_content for doc in docs]) if docs else "No context available."
    formatted_prompt = answer_prompt.format(context=context_string, question=question)
    prompt_tokens = count_tokens(formatted_prompt, model_id)
    
    # Store the prompt tokens as a variable that will be accessible for the caller
    # to include in the final metadata
    answer_chain = (answer_prompt | llm | StrOutputParser())

    # Store tokens for accumulation
    completion_text = ""
    
    # Yield tokens and accumulate for token counting
    for chunk in answer_chain.stream({"context": context_string, "question": question}):
        completion_text += chunk
        yield chunk 
    
    # Calculate completion tokens after streaming
    completion_tokens = count_tokens(completion_text, model_id)
    total_tokens = prompt_tokens + completion_tokens
    cost = calculate_cost(prompt_tokens, completion_tokens, model_id)
    
    # Log token information
    logging.info(f"[Tokens] Stream Prompt: {prompt_tokens}, Completion: {completion_tokens}, Total: {total_tokens}")
    logging.info(f"[Cost] Stream ${cost:.6f}")
    
    # Store metrics where the caller (rag_core.py) can access them
    generate_answer_stream.token_metrics = {
        "prompt_tokens": prompt_tokens,
        "completion_tokens": completion_tokens,
        "total_tokens": total_tokens,
        "cost": cost
    } 