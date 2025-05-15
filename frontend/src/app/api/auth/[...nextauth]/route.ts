import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import NextAuth from "next-auth";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

// Extension du type User de NextAuth pour inclure l'id et potentiellement d'autres champs si nécessaire
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      // Ajoute d'autres champs si tu veux les exposer dans la session
    }
  }
  // Si tu veux ajouter des champs au type User interne de NextAuth (pas souvent nécessaire)
  // interface User {
  //   role?: string;
  // }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    // Ajoute d'autres champs si tu veux les stocker dans le JWT
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // Configuration providers OAuth (décommenter et configurer les ID/secrets en production)
    
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    /*
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    */
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email et mot de passe requis");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            password: true,
          },
        });

        if (!user || !user.password) {
          // Si l'utilisateur n'existe pas OU s'il s'est inscrit via OAuth (pas de mdp)
          throw new Error("Email ou mot de passe incorrect");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Email ou mot de passe incorrect");
        }

        // Retourner l'utilisateur sans le mot de passe
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt", // Utiliser JWT pour les sessions, nécessaire avec Credentials
  },
  secret: process.env.NEXTAUTH_SECRET, 
  pages: {
    signIn: "/auth/signin",
    // signOut: "/auth/signout",
    // error: "/auth/error", // page pour afficher les erreurs d'authentification
  },
  callbacks: {
    // Pour inclure l'ID utilisateur dans le JWT
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    // Pour inclure l'ID utilisateur dans la session
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
    // Rediriger vers le dashboard après connexion réussie
    async redirect({ url, baseUrl }) {
      // Si l'utilisateur est redirigé vers une URL interne ou n'a pas d'URL spécifiée
      if (url.startsWith(baseUrl) || url === '/') {
        // Vérifier si l'URL de callback est explicitement définie
        if (url.includes('callbackUrl=')) {
          return url;
        }
        // Sinon rediriger vers le dashboard
        return `${baseUrl}/dashboard`;
      }
      // Pour les URL externes, conserver le comportement par défaut
      return url;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }; 