import logging
from RAG import AdvancedRAG

def main():
    # Initialize the RAG system
    print("Initializing AdvancedRAG...")
    rag = AdvancedRAG()
    
    # Ask a question
    question = "Quels sont les programmes informatiques proposés par CY Tech?"
    print(f"\nQuestion: {question}")
    
    # Get the answer
    print("\nRecherche de la réponse...")
    result = rag.answer_question(
        question=question,
        use_reranker=True,
        evaluate_sources=True
    )
    
    # Print the answer
    print("\n" + "="*80)
    print("RÉPONSE:")
    print("="*80)
    print(result["answer"])
    print("\n" + "="*80)
    
    # Print processing time
    print(f"Temps de traitement: {result['processing_time']:.2f} secondes")
    
    if result.get("source_evaluation"):
        print("\n" + "="*80)
        print("ÉVALUATION DES SOURCES:")
        print("="*80)
        print(result["source_evaluation"])

if __name__ == "__main__":
    main() 