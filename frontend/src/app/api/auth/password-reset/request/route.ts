import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import { Resend } from "resend";

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.EMAIL_FROM || "onboarding@resend.dev"; // Remplace par ton email vérifié sur Resend

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Important: Ne pas révéler si l'email existe ou non pour la sécurité
    if (user) {
      // Générer un token sécurisé
      const resetToken = crypto.randomBytes(32).toString("hex");
      const tokenExpiry = new Date(Date.now() + 3600000); // Expire dans 1 heure

      // Find existing token for this user
      const existingToken = await prisma.passwordResetToken.findFirst({
        where: { userId: user.id },
      });

      if (existingToken) {
        // Update the existing token
        await prisma.passwordResetToken.update({
          where: { id: existingToken.id },
          data: {
            token: resetToken,
            expires: tokenExpiry,
          },
        });
      } else {
        // Create a new token
        await prisma.passwordResetToken.create({
          data: {
            userId: user.id,
            token: resetToken,
            expires: tokenExpiry,
          },
        });
      }

      // Construire l'URL de réinitialisation
      const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`;

      // Envoyer l'email avec Resend
      try {
        await resend.emails.send({
          from: fromEmail,
          to: email,
          subject: "Réinitialisation de votre mot de passe - CY Tech AI Assistant",
          html: `<p>Bonjour ${user.name || ''},</p>
                 <p>Vous avez demandé une réinitialisation de mot de passe. Cliquez sur le lien ci-dessous pour continuer :</p>
                 <a href="${resetUrl}">Réinitialiser mon mot de passe</a>
                 <p>Ce lien expirera dans une heure.</p>
                 <p>Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email.</p>`,
        });
      } catch (emailError) {
        console.error("Erreur lors de l'envoi de l'email:", emailError);
        // Retourner une erreur générique même si l'email échoue
        // pour ne pas informer un attaquant potentiel
      }
    }

    // Toujours retourner un succès, même si l'email n'existe pas
    return NextResponse.json({
      message: "Si un compte avec cet email existe, un lien de réinitialisation a été envoyé.",
    });

  } catch (error) {
    console.error("Erreur lors de la demande de réinitialisation:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la demande de réinitialisation" },
      { status: 500 }
    );
  }
} 