# CY IA - Backend RAG

Service d'intelligence artificielle basé sur RAG (Retrieval-Augmented Generation) pour CY Tech, permettant d'interroger des données structurées à l'aide de modèles de langage avancés.

## Technologies

- **Flask** - Framework API Python léger
- **LangChain** - Framework pour les applications LLM
- **ChromaDB** - Base de données vectorielle
- **OpenAI** - Modèles LLM
- **Cohere** - Reranking des résultats
- **Railway** - Déploiement

## Fonctionnalités

- **Système RAG complet** - Interrogation de documents avec contexte
- **Support multi-modèles** - Compatible avec plusieurs modèles LLM
- **Reranking** - Amélioration de la pertinence des résultats
- **Streaming** - Réponses en temps réel
- **Évaluation des sources** - Analyse automatique de la qualité des sources
- **API REST** - Interface programmatique complète

## Structure du projet

```
backend/
├── RAG/                  # Module principal RAG
│   ├── config.py         # Configuration du RAG
│   ├── embeddings.py     # Gestion des embeddings
│   ├── llm.py            # Configuration des modèles LLM
│   ├── logging_utils.py  # Utilitaires de journalisation
│   ├── prompts.py        # Templates de prompts
│   ├── rag_core.py       # Fonctionnalités RAG de base
│   ├── retrieval.py      # Logique de récupération de documents
│   └── vectorstore.py    # Gestion de la base vectorielle
│
├── app/                  # Applications et API
│   ├── app.py            # API Flask principale
│   ├── cli_app.py        # Interface en ligne de commande
│   └── simple_rag_demo.py # Démo simple
│
├── scripts/              # Scripts utilitaires
│   ├── scraping/         # Scripts de scraping web
│   ├── preprocessing/    # Prétraitement des documents
│   └── combined/         # Scripts combinés
│
├── data/                 # Données
│   ├── raw/              # Documents bruts
│   ├── preprocessed/     # Documents prétraités
│   └── vectorstore/      # Index vectoriel
│
├── logs/                 # Journaux d'application
├── requirements.txt      # Dépendances Python
└── .env.example          # Exemple de configuration
```

## Configuration

Créez un fichier `.env` à la racine du projet backend avec :

```
# API Keys
OPENAI_API_KEY=votre_clé_openai
COHERE_API_KEY=votre_clé_cohere  # Optionnel pour le reranking

# Configuration de l'API
CORS_ALLOWED_ORIGINS=http://localhost:3000  # URL du frontend en dev

# Monitoring (optionnel)
USE_HELICONE=False
HELICONE_API_KEY=votre_clé_helicone
```

## Installation

```bash
# Créer un environnement virtuel
python -m venv env

# Activer l'environnement (Windows)
env\Scripts\activate
# Activer l'environnement (Linux/Mac)
source env/bin/activate

# Installer les dépendances
pip install -r requirements.txt
```

## Préparation des données

```bash
# Scraping des données (si nécessaire)
python -m scripts.scraping.all_pages

# Prétraitement et indexation en une seule étape
python -m scripts.combined.preprocess_and_index
```

## Développement

```bash
# Lancer l'API Flask en développement
cd backend
python -m app.app
```

Le serveur sera accessible à l'adresse [http://localhost:5000](http://localhost:5000).

## API Endpoints

- **GET /api/models** - Liste des modèles disponibles
- **POST /api/chat** - Endpoint pour les requêtes RAG
- **POST /api/chat/stream** - Endpoint pour les requêtes RAG en streaming
- **GET /api/helicone/status** - Statut de l'intégration Helicone

## Déploiement sur Railway

1. Connectez votre repo GitHub à Railway
2. Configurez le service pour utiliser le dossier `/backend`
3. Ajoutez les variables d'environnement nécessaires
4. Créez un volume pour les données vectorielles (montage sur `/app/data`)
5. Configurez une custom deploy command pour initialiser le vectorstore:
   ```
   python -m scripts.combined.preprocess_and_index
   ```

## Paramètres avancés

Le système RAG supporte plusieurs paramètres:
- `use_reranker` - Utilise Cohere pour améliorer le classement des documents
- `use_multi_query` - Génère plusieurs variantes de la requête pour améliorer la recherche
- `evaluate_sources` - Fournit une évaluation de la qualité des sources utilisées
- `k` - Nombre de documents à récupérer (par défaut: 4)
- `rerank_k` - Nombre de documents à récupérer avant reranking (par défaut: 20)
- Paramètres de sampling LLM: `temperature`, `top_p`, `top_k`, etc.

## Logs et Monitoring

Les logs sont stockés dans le dossier `logs/` et incluent:
- Performances des requêtes
- Métriques d'utilisation des tokens
- Erreurs et diagnostics


