"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Une erreur est survenue");
      } else {
        setMessage(data.message);
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
        <h1 className="mb-6 text-center text-2xl font-bold">Mot de passe oublié</h1>

        {message && (
          <div className="mb-4 rounded-lg bg-blue-100 p-3 text-blue-700">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-lg bg-red-100 p-3 text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Entrez votre adresse email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 focus:border-primary focus:ring-primary"
              required
              placeholder="nom@exemple.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary py-2 text-primary-foreground transition hover:bg-primary/90 disabled:opacity-70"
          >
            {loading ? "Envoi en cours..." : "Envoyer le lien de réinitialisation"}
          </button>

          <div className="mt-4 text-center text-sm">
            <Link href="/auth/signin" className="font-medium text-primary hover:underline">
              Retour à la connexion
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
} 