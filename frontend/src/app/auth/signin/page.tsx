"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { AuthLayout } from "@/components/features/layout/AuthLayout";

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError("Identifiants incorrects. Veuillez réessayer.");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Une erreur de communication est survenue.";
      setError(`${errorMessage} Veuillez réessayer.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Connexion" 
      subtitle="Connectez-vous à votre compte"
    >
      {error && (
        <div className="w-full rounded-lg bg-red-100 p-3 text-red-700 text-sm">
          {error}
        </div>
      )}

      <form className="flex w-full flex-col gap-3" onSubmit={handleSubmit}>
        <input
          className="border-b border-border bg-transparent py-2 outline-none focus:border-primary text-foreground placeholder:text-default-400"
          placeholder="Adresse email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <input
          className="border-b border-border bg-transparent py-2 outline-none focus:border-primary text-foreground placeholder:text-default-400"
          placeholder="Mot de passe"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
        <div className="flex w-full items-center justify-end py-1 text-sm">
          <Link href="/auth/forgot-password" className="text-primary hover:underline">
            Mot de passe oublié ?
          </Link>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full rounded-md bg-primary py-2 text-primary-foreground transition hover:bg-primary/90 disabled:opacity-70"
        >
          {loading ? "Connexion..." : "Se connecter"}
        </button>
      </form>

      {/* Separator */}
      <div className="flex w-full items-center gap-4 py-2">
        <div className="flex-1 border-t border-border" />
        <p className="shrink-0 text-tiny text-default-500">OU</p>
        <div className="flex-1 border-t border-border" />
      </div>

      {/* OAuth Buttons */}
      <div className="flex w-full flex-col gap-2">
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className="flex items-center justify-center gap-2 rounded-md border border-border bg-background py-2 text-foreground hover:bg-muted transition"
        >
          <Icon icon="flat-color-icons:google" width={24} />
          Continuer avec Google
        </button>
        <button
          type="button"
          onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
          className="flex items-center justify-center gap-2 rounded-md border border-border bg-background py-2 text-foreground hover:bg-muted transition"
        >
          <Icon icon="fe:github" width={24} className="text-default-500" />
          Continuer avec GitHub
        </button>
      </div>

      <p className="pt-4 text-center text-sm text-foreground">
        Pas encore de compte ?{' '}
        <Link href="/auth/signup" className="font-medium text-primary hover:underline">
          S&apos;inscrire
        </Link>
      </p>
    </AuthLayout>
  );
} 