'use client';

import { useState, FormEvent } from 'react';
import { DashboardLayout } from '@/components/features/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, subject, message }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(result.message || "Votre message a été envoyé.");
        // Réinitialiser le formulaire
        setName('');
        setEmail('');
        setSubject('');
        setMessage('');
      } else {
        toast.error(result.error || "Échec de l\'envoi du message.");
      }
    } catch (error) {
      console.error("Erreur lors de la soumission du formulaire:", error);
      toast.error("Une erreur s\'est produite. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto max-w-2xl py-8 px-4">
        <h1 className="text-3xl font-bold mb-8 text-center">Contactez-nous</h1>
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="mb-6">
            <Label htmlFor="name" className="mb-2 block">Nom (Optionnel)</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Votre nom"
              className="mt-1"
            />
          </div>
          <div className="mb-6">
            <Label htmlFor="email" className="mb-2 block">Votre Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votreadresse@example.com"
              required
              className="mt-1"
            />
          </div>
          <div className="mb-6">
            <Label htmlFor="subject" className="mb-2 block">Sujet</Label>
            <Input
              id="subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Sujet de votre message"
              required
              className="mt-1"
            />
          </div>
          <div className="mb-6">
            <Label htmlFor="message" className="mb-2 block">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Écrivez votre message ici..."
              rows={10}
              required
              className="mt-1 min-h-[200px]"
            />
          </div>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Envoi en cours...' : 'Envoyer le Message'}
          </Button>
        </form>
      </div>
    </DashboardLayout>
  );
} 