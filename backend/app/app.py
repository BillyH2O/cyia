import sys
import os
from pathlib import Path
from flask import Flask, request, jsonify, g
from flask_cors import CORS
import logging
import time
from functools import wraps
import json
sys.path.append(str(Path(__file__).parent.parent.parent))

from backend.RAG.rag_core import AdvancedRAG
from backend.config import Config
from dotenv import load_dotenv
load_dotenv(dotenv_path=Path(__file__).parents[1] / ".env")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Check for required environment variables
if not os.getenv("OPENAI_API_KEY"):
    logging.error("OPENAI_API_KEY not found in .env file.")
    exit(1)

# Check if vectorstore exists
vectorstore_path = Config.VECTORSTORE_DIR
if not os.path.exists(vectorstore_path):
    logging.error(f"{vectorstore_path} directory not found.")
    logging.error("Please run the script to create the vectorstore first.")
    exit(1)

app = Flask(__name__)
# --- CORS Configuration ---
cors_origins = os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:3000").split(',') # Allow requests from Next.js default development port (3000)
CORS(app, resources={r"/api/*": {"origins": cors_origins}}) 
logging.info(f"CORS enabled for origins: {cors_origins}")

# --- Middleware pour l'instrumentation des APIs et l'intégration Helicone ---
def track_api_performance(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        start_time = time.time()
        
        # Générer un ID unique pour la requête si Helicone est activé
        request_id = None
        if Config.USE_HELICONE:
            import uuid
            request_id = str(uuid.uuid4())
            g.helicone_request_id = request_id
            logging.info(f"Starting request with Helicone ID: {request_id}")
        
        # Exécuter la fonction
        result = f(*args, **kwargs)
        
        elapsed_time = time.time() - start_time
        # Logger les performances
        endpoint = request.path
        method = request.method
        status_code = result[1] if isinstance(result, tuple) and len(result) > 1 else 200
        logging.info(f"API Call: {method} {endpoint} | Status: {status_code} | Duration: {elapsed_time:.2f}s")
        
        if Config.USE_HELICONE and request_id:
            logging.info(f"Helicone request {request_id} completed in {elapsed_time:.2f}s")
            
        return result
    return decorated_function

rag_instance = None
try:
    logging.info("Initializing AdvancedRAG...")
    rag_instance = AdvancedRAG()
    logging.info("AdvancedRAG initialized successfully.")
except Exception as e:
    logging.exception(f"Critical Error initializing AdvancedRAG: {e}")

@app.route('/api/chat', methods=['POST'])
@track_api_performance
def chat_endpoint():
    if rag_instance is None:
        logging.error("Chat request received but RAG system is not initialized.")
        return jsonify({"error": "RAG system failed to initialize. Check backend logs."}), 500

    data = request.get_json()
    if not data or 'question' not in data or not data['question'].strip():
        logging.warning("Received invalid chat request (missing or empty question).")
        return jsonify({"error": "Missing or empty 'question' in request body"}), 400

    question = data['question'].strip()
    evaluate_sources = data.get('evaluate_sources', False)
    use_reranker = data.get('use_reranker', False)
    use_multi_query = data.get('use_multi_query', False)
    model = data.get('model')
    temperature = data.get('temperature', 1.0)  # Valeur par défaut de 1.0 selon la doc
    
    # Validation de la température
    try:
        temperature = float(temperature)
        if temperature < 0.0 or temperature > 2.0:
            logging.warning(f"Temperature value out of range ({temperature}), using default 1.0")
            temperature = 1.0
    except (ValueError, TypeError):
        logging.warning(f"Invalid temperature value ({temperature}), using default 1.0")
        temperature = 1.0
    
    # Nouveaux paramètres de récupération (nombre de documents)
    k = data.get('k')  # Nombre de documents à récupérer
    rerank_k = data.get('rerank_k')  # Nombre de documents à récupérer avant reranking
    
    # Ajouter des métadonnées pour Helicone si configuré
    helicone_headers = {}
    if Config.USE_HELICONE and hasattr(g, 'helicone_request_id'):
        helicone_headers = {
            "Helicone-Auth": Config.HELICONE_API_KEY,
            "Helicone-Request-Id": g.helicone_request_id,
            "Helicone-Property-Question": question[:100],  # Tronquer pour éviter des valeurs trop longues
            "Helicone-Property-UseReranker": str(use_reranker).lower(),
            "Helicone-Property-UseMultiQuery": str(use_multi_query).lower(),
            "Helicone-Property-EvaluateSources": str(evaluate_sources).lower(),
            "Helicone-Property-Temperature": str(temperature),
        }
    
    if model and model not in Config.AVAILABLE_MODELS:
        logging.warning(f"Requested model '{model}' is not in available models. Will use default.")
    
    logging.info(
        f"Received question: '{question}', EvalSources={evaluate_sources}, Reranker={use_reranker}, MultiQuery={use_multi_query}, Model={model or Config.DEFAULT_MODEL}, "
        f"T={temperature}, top_p={data.get('top_p')}, top_k={data.get('top_k')}, freq_pen={data.get('frequency_penalty')}, pres_pen={data.get('presence_penalty')}, rep_pen={data.get('repetition_penalty')}, seed={data.get('seed')}, max_tokens={data.get('max_tokens')}, k={k}, rerank_k={rerank_k}"
    )

    try:
        result = rag_instance.answer_question(
            question=question,
            evaluate_sources=evaluate_sources,
            use_reranker=use_reranker,
            use_multi_query=use_multi_query,
            model=model,
            temperature=temperature,
            top_p=data.get('top_p'),
            top_k=data.get('top_k'),
            frequency_penalty=data.get('frequency_penalty'),
            presence_penalty=data.get('presence_penalty'),
            repetition_penalty=data.get('repetition_penalty'),
            seed=data.get('seed'),
            max_tokens=data.get('max_tokens'),
            k=k,
            rerank_k=rerank_k,
        )
        logging.info(f"Successfully generated answer for question: '{question}'")
        print('Réponse envoyée au frontend:', result)
        return jsonify(result)
    except Exception as e:
        logging.exception(f"Error processing question '{question}': {e}")
        return jsonify({"error": f"An internal error occurred while processing the request: {e}"}), 500

# Endpoint pour récupérer la liste des modèles disponibles
@app.route('/api/models', methods=['GET'])
@track_api_performance
def get_models(): 
    return jsonify({
        "models": Config.AVAILABLE_MODELS,
        "default": Config.DEFAULT_MODEL
    })

# Endpoint pour vérifier la configuration Helicone
@app.route('/api/helicone/status', methods=['GET'])
@track_api_performance
def helicone_status():
    status = {
        "enabled": Config.USE_HELICONE,
        "api_key_configured": Config.HELICONE_API_KEY is not None,
        "environment": "production" if not os.getenv("FLASK_ENV") == "development" else "development"
    }
    return jsonify(status)

# -------------------------------------------------------------------------
# Streaming endpoint ------------------------------------------------------
# -------------------------------------------------------------------------

@app.route('/api/chat/stream', methods=['POST'])
def chat_stream_endpoint():
    """Endpoint that streams the answer using Server-Sent Events (SSE).
    """
    if rag_instance is None:
        logging.error("Chat stream request received but RAG system is not initialized.")
        return jsonify({"error": "RAG system failed to initialize. Check backend logs."}), 500

    # Ensure mimetype is text/event-stream for SSE
    def generate_sse(data: str, event: str = None):
        """Utility: formats a data string as SSE."""
        msg = ""
        if event:
            msg += f"event: {event}\n"
        for line in data.split("\n"):
            msg += f"data: {line}\n"
        msg += "\n"
        return msg

    data = request.get_json()
    if not data or 'question' not in data or not data['question'].strip():
        return jsonify({"error": "Missing or empty 'question' in request body"}), 400

    question = data['question'].strip()
    evaluate_sources = data.get('evaluate_sources', False)
    use_reranker = data.get('use_reranker', False)
    use_multi_query = data.get('use_multi_query', False)
    model = data.get('model')
    temperature = data.get('temperature', 1.0)  # Valeur par défaut de 1.0 selon la doc
    
    # Validation de la température
    try:
        temperature = float(temperature)
        if temperature < 0.0 or temperature > 2.0:
            logging.warning(f"Temperature value out of range ({temperature}), using default 1.0")
            temperature = 1.0
    except (ValueError, TypeError):
        logging.warning(f"Invalid temperature value ({temperature}), using default 1.0")
        temperature = 1.0

    # Nouveaux paramètres de récupération (nombre de documents)
    k = data.get('k')  # Nombre de documents à récupérer
    rerank_k = data.get('rerank_k')  # Nombre de documents à récupérer avant reranking

    # New sampling parameters
    top_p = data.get('top_p')
    top_k = data.get('top_k')
    frequency_penalty = data.get('frequency_penalty')
    presence_penalty = data.get('presence_penalty')
    repetition_penalty = data.get('repetition_penalty')
    seed = data.get('seed')
    max_tokens = data.get('max_tokens')

    logging.info(f"[SSE] Streaming answer for question: '{question[:80]}...' (Reranker={use_reranker}, MultiQuery={use_multi_query}, Evaluate={evaluate_sources}, Model={model}, T={temperature}, top_p={top_p}, top_k={top_k}, freq_pen={frequency_penalty}, pres_pen={presence_penalty}, rep_pen={repetition_penalty}, seed={seed}, max_tokens={max_tokens})")

    def event_stream():
        # Stream chunks from RAG
        try:
            answer_gen = rag_instance.answer_question_stream(
                question=question,
                use_reranker=use_reranker,
                use_multi_query=use_multi_query,
                evaluate_sources=evaluate_sources,
                model=model,
                temperature=temperature,
                top_p=top_p,
                top_k=top_k,
                frequency_penalty=frequency_penalty,
                presence_penalty=presence_penalty,
                repetition_penalty=repetition_penalty,
                seed=seed,
                max_tokens=max_tokens,
                k=k,
                rerank_k=rerank_k,
            )

            for chunk in answer_gen:
                # If the backend sent a metadata JSON (no newline), wrap it as SSE
                try:
                    # Detect if chunk looks like JSON
                    json.loads(chunk)
                    yield generate_sse(chunk)  # already JSON string
                except Exception:
                    # Regular text chunk
                    yield generate_sse(chunk)

            # End of stream marker per SSE convention
            yield generate_sse("[DONE]", event="done")
        except Exception as e:
            logging.exception(f"Error during streaming: {e}")
            yield generate_sse(f"Error: {str(e)}", event="error")

    # Return a streaming response
    return app.response_class(event_stream(), mimetype='text/event-stream')

if __name__ == '__main__':
    logging.info("Starting Flask development server...")
    app.run(host='0.0.0.0', port=5000, debug=False) # Runs the Flask development server | Host 0.0.0.0 makes it accessible on the network | Default port is 5000 debug=True enables auto-reloading and auto-restarting of the server on code changes