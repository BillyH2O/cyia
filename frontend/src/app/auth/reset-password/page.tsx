"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetPasswordComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const tokenFromUrl = searchParams.get("token");
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      setError("Jeton de réinitialisation manquant ou invalide.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (!token) {
        setError("Jeton de réinitialisation manquant.");
        return;
    }

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/auth/password-reset/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Une erreur est survenue lors de la réinitialisation");
      } else {
        setMessage(data.message + " Vous allez être redirigé vers la page de connexion.");
        setTimeout(() => {
          router.push("/auth/signin");
        }, 3000);
      }
    } catch (err) {
      setError("Impossible de contacter le serveur");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30">
      <div className="w-full max-w-md rounded-lg bg-card p-8 shadow-sm">
        <h1 className="mb-6 text-center text-2xl font-bold">Réinitialiser le mot de passe</h1>

        {message && (
          <div className="mb-4 rounded-lg bg-green-100 p-3 text-green-700">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-lg bg-red-100 p-3 text-red-700">
            {error}
          </div>
        )}

        {token && !message && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium">
                Nouveau mot de passe
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 focus:border-primary focus:ring-primary"
                required
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium">
                Confirmer le nouveau mot de passe
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 focus:border-primary focus:ring-primary"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-primary py-2 text-primary-foreground transition hover:bg-primary/90 disabled:opacity-70"
            >
              {loading ? "Réinitialisation en cours..." : "Réinitialiser le mot de passe"}
            </button>
          </form>
        )}

        <div className="mt-4 text-center text-sm">
            <Link href="/auth/signin" className="font-medium text-primary hover:underline">
              Retour à la connexion
            </Link>
        </div>
      </div>
    </div>
  );
}

// Utiliser Suspense pour gérer le rendu côté client de useSearchParams
export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div>Chargement...</div>}>
            <ResetPasswordComponent />
        </Suspense>
    );
} 