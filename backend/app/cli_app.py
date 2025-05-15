"""
Démo simple du système RAG utilisant les données prétraitées
"""

import os
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent.parent))

from dotenv import load_dotenv
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_community.vectorstores import Chroma
from langchain.prompts import PromptTemplate
from langchain.chains import RetrievalQA
from backend.config import Config

load_dotenv(dotenv_path=Path(__file__).parents[1] / ".env")

def initialize_vectorstore():
    embeddings = OpenAIEmbeddings()
    vectorstore = Chroma(
        persist_directory=str(Config.VECTORSTORE_DIR),
        embedding_function=embeddings
    )
    print(f"✅ Vectorstore chargé depuis {Config.VECTORSTORE_DIR}")
    return vectorstore

def create_retriever(vectorstore):
    retriever = vectorstore.as_retriever(
        search_type="similarity",
        search_kwargs={"k": Config.DEFAULT_K}
    )
    return retriever

def initialize_llm():
    llm = ChatOpenAI(
        model=Config.LLM_MODEL,
        temperature=0.3
    )
    return llm

def create_qa_chain(llm, retriever):
    """Crée la chaîne question-réponse"""
    prompt_template = """Vous êtes un assistant spécialisé pour CY Tech.
Utilisez uniquement les informations du contexte suivant pour répondre aux questions.
Si les informations nécessaires ne sont pas dans le contexte, indiquez simplement
que vous ne disposez pas de ces informations, sans inventer de réponse.

Contexte:
{context}

Question: {question}
Réponse:"""

    PROMPT = PromptTemplate(
        template=prompt_template,
        input_variables=["context", "question"]
    )

    chain = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=retriever,
        return_source_documents=True,
        chain_type_kwargs={"prompt": PROMPT}
    )
    
    return chain

def main():
    """Fonction principale"""
    # Initialisation
    vectorstore = initialize_vectorstore()
    retriever = create_retriever(vectorstore)
    llm = initialize_llm()
    qa_chain = create_qa_chain(llm, retriever)
    
    print("\n🤖 Démo RAG pour CY Tech")
    print("Posez vos questions ou tapez 'exit' pour quitter\n")
    
    while True:
        question = input("Question: ")
        if question.lower() in ["exit", "quit", "q"]:
            break
            
        if not question.strip():
            continue
            
        try:
            # Exécution de la requête
            result = qa_chain({"query": question})
            
            # Affichage de la réponse
            print("\n🔍 Réponse:")
            print(result["result"])
            
            # Affichage des sources
            print("\n📚 Sources:")
            for i, doc in enumerate(result["source_documents"]):
                print(f"  {i+1}. {doc.metadata.get('title', 'Document sans titre')}")
                
            print()
            
        except Exception as e:
            print(f"❌ Erreur: {str(e)}")
    
    print("👋 Au revoir!")

if __name__ == "__main__":
    main() 