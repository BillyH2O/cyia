"""
Module de gestion des prompts pour le système RAG de CY Tech.
Centralise les templates de prompts utilisés pour la génération de réponses et l'évaluation des sources.
"""

from langchain.prompts import ChatPromptTemplate
from typing import Tuple

def initialize_prompts() -> Tuple[ChatPromptTemplate, ChatPromptTemplate]:
    """Initialise les prompts standards pour le système RAG."""
    
    # Prompt principal pour générer des réponses basées sur le contexte récupéré
    answer_prompt = ChatPromptTemplate.from_template("""
        Tu es un assistant virtuel expert pour l'école d'ingénieurs CY Tech .
        Tu dois répondre aux questions des utilisateurs en te basant uniquement sur les informations fournies ci-dessous.
        Si les informations fournies ne contiennent pas la réponse, indique simplement que tu ne sais pas, mais ne fabrique jamais d'informations.

        Pour les réponses factuelles, cite tes sources en incluant l'URL quand elle est disponible.
        Organise ta réponse de manière claire et structurée.
        Si la question concerne des formations, des admissions, ou des campus, donne des détails précis et complets.

        Contexte:
        {context}

        Question: {question}

        Réponse:
        """)

    # Prompt pour évaluer la qualité et la pertinence des sources utilisées
    source_evaluation_prompt = ChatPromptTemplate.from_template("""
        En tant qu'expert en analyse de l'information pour CY Tech, examine les sources suivantes qui ont été récupérées pour répondre à la question.
        Évalue la pertinence, la complétude et la fiabilité de ces sources pour répondre à la question posée.

        Sources:
        {sources}

        Question: {question}

        Fournir une évaluation structurée, incluant:
        1. Si les sources sont suffisantes pour répondre à la question
        2. Quelles sources sont les plus pertinentes
        3. Si des informations importantes semblent manquer
        4. Niveau de confiance global dans les sources (faible/moyen/élevé)

        Évaluation:
        """)
    
    return answer_prompt, source_evaluation_prompt 