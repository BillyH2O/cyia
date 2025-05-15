# Configuration de PostgreSQL sur Supabase

Ce document détaille les étapes pour configurer votre base de données PostgreSQL sur Supabase en production.

## 1. Créer un projet Supabase

1. Créez un compte sur [Supabase](https://supabase.com/) si ce n'est pas déjà fait
2. Créez un nouveau projet
3. Choisissez une région proche de vos utilisateurs (par exemple Europe)
4. Définissez un mot de passe sécurisé pour la base de données

## 2. Obtenir les informations de connexion

Une fois votre projet créé, vous aurez besoin des informations suivantes :

1. Allez dans `Project Settings` > `Database`
2. Repérez la section `Connection string`
3. Copiez la chaîne de connexion au format `URI`

## 3. Configuration des variables d'environnement

Modifiez votre fichier `.env` (en production) avec l'URL de connexion Supabase :

```
DATABASE_URL="postgresql://postgres:[MOT_DE_PASSE]@db.[PROJET-ID].supabase.co:5432/postgres"
```

Remplacez `[MOT_DE_PASSE]` par le mot de passe de la base de données et `[PROJET-ID]` par l'identifiant de votre projet.

## 4. Déployer le schéma de base de données

Pour déployer votre schéma Prisma sur Supabase :

```bash
npx prisma db push
```

Cette commande créera toutes les tables nécessaires dans votre base de données Supabase.

## 5. (Optionnel) Prisma Studio

Pour visualiser et gérer vos données, vous pouvez utiliser Prisma Studio :

```bash
npx prisma studio
```

## 6. Configuration OAuth pour Auth.js

Si vous souhaitez utiliser l'authentification OAuth (Google, GitHub, etc.) :

1. Allez sur la console de développeur de chaque fournisseur pour obtenir les clés API
2. Ajoutez les identifiants dans votre fichier `.env` :

```
GOOGLE_CLIENT_ID="votre-client-id"
GOOGLE_CLIENT_SECRET="votre-client-secret"
GITHUB_ID="votre-github-id"
GITHUB_SECRET="votre-github-secret"
```

3. Décommentez la configuration des fournisseurs dans `app/api/auth/[...nextauth]/route.ts`

## 7. Configuration du secret NextAuth

Assurez-vous de définir un secret sécurisé pour NextAuth en production :

```
NEXTAUTH_SECRET="votre-secret-ultra-securise"
NEXTAUTH_URL="https://votre-domaine.com"
```

## 8. Modèle de migration pour les mises à jour futures

Pour les futures modifications du schéma :

```bash
# Créer une migration
npx prisma migrate dev --name nom_de_la_migration

# Appliquer les migrations en production
npx prisma migrate deploy
``` 