# CY IA - Frontend

Application Next.js pour CY IA, une solution d'intelligence artificielle personnalisée pour CY Tech, intégrant un système RAG complet.

## Technologies

- **Next.js** - Framework React avec architecture App Router
- **Tailwind CSS** - Styling
- **Prisma** - ORM pour PostgreSQL
- **NextAuth.js** - Authentification
- **Shadcn/UI** - Composants UI
- **Vercel** - Déploiement

## Fonctionnalités

- **Interface utilisateur moderne** - Design responsif pour mobile et desktop
- **RAG (Retrieval-Augmented Generation)** - Interrogez des données CY Tech avec plusieurs modèles IA
- **RAG Mail** - Interrogez vos emails avec l'IA
- **Playground** - Interface avancée pour tester différents modèles et paramètres
- **Authentification** - Connexion sécurisée avec NextAuth
- **Statistiques d'utilisation** - Suivez l'utilisation des modèles et des fonctionnalités

## Structure du projet

```
frontend/
├── public/             # Fichiers statiques
├── src/                # Code source
│   ├── app/            # Next.js App Router
│   ├── components/     # Composants React
│   ├── contexts/       # Contextes React
│   ├── hooks/          # Custom hooks
│   ├── lib/            # Utilitaires et helpers
│   ├── services/       # Services API
│   └── types/          # Types TypeScript
├── prisma/             # Schéma et migrations Prisma
├── .env.example        # Exemple de configuration
└── package.json        # Dépendances
```

## Configuration

Créez un fichier `.env.local` à la racine du projet frontend avec :

```
# Base de données
DATABASE_URL="postgresql://user:password@host:port/database"

# API
NEXT_PUBLIC_API_URL="http://localhost:5000"  # URL du backend Flask en dev

# NextAuth
NEXTAUTH_SECRET="votre-secret-pour-nextauth"
NEXTAUTH_URL="http://localhost:3000"  # URL du frontend en dev

# OpenAI - optionnel pour les fonctions frontend qui utilisent l'API directement
OPENAI_API_KEY="votre-clé-openai"
```

## Installation

```bash
# Installer les dépendances
npm install

# Générer le client Prisma
npx prisma generate

# Créer et appliquer les migrations (si nécessaire)
npx prisma migrate dev
```

## Développement

```bash
# Démarrer le serveur de développement
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## Déploiement sur Vercel

1. Connectez votre repo GitHub à Vercel
2. Configurez ces variables d'environnement dans Vercel :
   - `DATABASE_URL` - URL de connexion Neon DB ou autre PostgreSQL
   - `NEXT_PUBLIC_API_URL` - URL de votre backend déployé (Railway)
   - `NEXTAUTH_URL` - URL de votre frontend déployé
   - `NEXTAUTH_SECRET` - Chaîne secrète pour NextAuth

3. Déployez !

## API Routes

L'application utilise Next.js API Routes comme backend:

- `/api/auth/*` - Routes d'authentification NextAuth
- `/api/chat` - Communication avec le backend IA
- `/api/user/*` - Gestion des utilisateurs
- `/api/stats/*` - Statistiques d'utilisation

## Modèles IA disponibles

L'application prend en charge plusieurs modèles IA :
- Claude 3.7 Sonnet
- GPT-4.1 avec vision
- Deepseek R1
- Grok3-mini-beta
- Gemini 2.0 Flash Lite
- Mistral 8b
- Qwen 2.5 7B

## Contributions

Consultez `CONTRIBUTING.md` pour les directives de contribution.

## Licence

Ce projet est la propriété de CY Tech. Tous droits réservés.
