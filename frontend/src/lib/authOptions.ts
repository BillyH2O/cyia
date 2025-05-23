import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcrypt";

// Initialise Prisma client (single instance)
const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
//                      NextAuth Type Augmentations
// ---------------------------------------------------------------------------
// These module declarations extend the default types provided by NextAuth so
// that the added properties (e.g. `id`) are available throughout the app.
// Because this file will be imported by every route/component that needs
// `authOptions`, the declarations only need to live here.
// ---------------------------------------------------------------------------

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
  }
}

// ---------------------------------------------------------------------------
//                              Auth Options
// ---------------------------------------------------------------------------
// Centralised configuration for Next-Auth.  Import this object anywhere you  
// need to call `getServerSession` so that the same configuration is used in   
// every route.                                                                
// ---------------------------------------------------------------------------

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // OAuth provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // Credentials provider (email + password)
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
          // Either the user doesn't exist or signed up via OAuth
          throw new Error("Email ou mot de passe incorrect");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Email ou mot de passe incorrect");
        }

        // Return user object without password
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        } as const;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as { id: string }).id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl) || url === "/") {
        if (url.includes("callbackUrl=")) {
          return url;
        }
        return `${baseUrl}/dashboard`;
      }
      return url;
    },
  },
}; 