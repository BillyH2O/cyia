import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();
const saltRounds = 10;

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Jeton et nouveau mot de passe requis" },
        { status: 400 }
      );
    }

    // 1. Trouver le token dans la BDD
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true }, // Inclure l'utilisateur associé
    });

    // 2. Vérifier si le token existe et n'est pas expiré
    if (!resetToken || resetToken.expires < new Date()) {
      return NextResponse.json(
        { error: "Jeton invalide ou expiré" },
        { status: 400 }
      );
    }

    // 3. Hacher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 4. Mettre à jour le mot de passe de l'utilisateur
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword },
    });

    // 5. Supprimer le token utilisé de la BDD
    await prisma.passwordResetToken.delete({
      where: { id: resetToken.id },
    });

    return NextResponse.json({ message: "Mot de passe réinitialisé avec succès" });

  } catch (error) {
    console.error("Erreur lors de la réinitialisation du mot de passe:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la réinitialisation du mot de passe" },
      { status: 500 }
    );
  }
} 