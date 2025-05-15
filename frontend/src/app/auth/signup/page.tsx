"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthLayout } from "@/components/features/layout/AuthLayout";

export default function SignUp() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (!name || !email || !password) {
      setError("Tous les champs sont requis");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Une erreur est survenue lors de l'inscription");
      } else {
        setSuccess("Inscription réussie ! Vous allez être redirigé...");
        setTimeout(() => {
          router.push("/auth/signin");
        }, 2000);
      }
    } catch (err) {
      setError("Une erreur est survenue lors de la communication avec le serveur");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Créer un compte" 
      subtitle="Inscrivez-vous pour commencer"
    >
      {/* Specific content for SignUp page */}
      {error && (
        <div className="w-full rounded-lg bg-red-100 p-3 text-red-700 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="w-full rounded-lg bg-green-100 p-3 text-green-700 text-sm">
          {success}
        </div>
      )}

      <form className="flex w-full flex-col gap-3" onSubmit={handleSubmit}>
        <input
          className="border-b border-border bg-transparent py-2 outline-none focus:border-primary text-foreground placeholder:text-default-400"
          placeholder="Nom"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
        />
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
          autoComplete="new-password"
        />

        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full rounded-md bg-primary py-2 text-primary-foreground transition hover:bg-primary/90 disabled:opacity-70"
        >
          {loading ? "Inscription..." : "S'inscrire"}
        </button>
      </form>

      <p className="pt-4 text-center text-sm text-foreground">
        Déjà un compte ?{' '}
        <Link href="/auth/signin" className="font-medium text-primary hover:underline">
          Se connecter
        </Link>
      </p>
    </AuthLayout>
  );
} 