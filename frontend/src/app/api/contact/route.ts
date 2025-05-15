'use server';

import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json();

    // --- Basic Validation ---
    if (!email || !subject || !message) {
      return NextResponse.json({ error: 'Email, sujet et message requis.' }, { status: 400 });
    }

    // --- Configure Nodemailer Transporter ---
    // IMPORTANT: Use environment variables for security. Do NOT hardcode credentials.
    // You might need an "App Password" for Gmail if 2FA is enabled.
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST, // e.g., 'smtp.gmail.com'
      port: parseInt(process.env.EMAIL_SERVER_PORT || '465', 10), // e.g., 465 for Gmail SSL
      secure: parseInt(process.env.EMAIL_SERVER_PORT || '465', 10) === 465, // true for 465, false for other ports like 587
      auth: {
        user: process.env.EMAIL_SERVER_USER, // Your sending email address
        pass: process.env.EMAIL_SERVER_PASSWORD, // Your email password or App Password
      },
    });

    // --- Verify transporter config (optional but recommended) ---
    try {
      await transporter.verify();
      console.log("Email server connection verified.");
    } catch (verifyError) {
      console.error("Email server verification failed:", verifyError);
      return NextResponse.json({ error: 'Échec de la connexion au serveur de messagerie.' }, { status: 500 });
    }
    
    // --- Define Email Options ---
    const mailOptions = {
      from: `"${name || 'Formulaire de Contact'}" <${process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER}>`, // Sender address shown in email
      to: process.env.CONTACT_EMAIL_RECIPIENT, // The recipient (bossbil93@gmail.com)
      replyTo: email, // Set the user's email as Reply-To
      subject: `[Contact Form] ${subject}`, // Prepend subject for clarity
      text: `Nom: ${name || 'Non fourni'}\nEmail: ${email}\n\nMessage:\n${message}`,
      html: `<p><strong>Nom:</strong> ${name || 'Non fourni'}</p>
             <p><strong>Email:</strong> ${email}</p>
             <hr>
             <p><strong>Message:</strong></p>
             <p>${message.replace(/\n/g, '<br>')}</p>`,
    };

    // --- Send Email ---
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent: ' + info.response);
      return NextResponse.json({ success: true, message: 'E-mail envoyé avec succès !' }, { status: 200 });
    } catch (sendError) {
      console.error('Error sending email:', sendError);
      return NextResponse.json({ error: 'Erreur lors de l\'envoi de l\'e-mail.' }, { status: 500 });
    }

  } catch (error) {
    console.error('Error processing contact form:', error);
    // Check if the error is due to JSON parsing
    if (error instanceof SyntaxError) {
        return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erreur interne du serveur.' }, { status: 500 });
  }
} 