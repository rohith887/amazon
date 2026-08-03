import nodemailer from "nodemailer";

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST) return null;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined,
  });
  return transporter;
}

export async function sendOtpEmail(email, code) {
  const mailer = getTransporter();
  if (!mailer) {
    // Dev fallback: no SMTP configured yet, just log the code.
    console.log(`[otp] code for ${email}: ${code}`);
    return;
  }
  await mailer.sendMail({
    from: process.env.SMTP_FROM ?? "Grassroots CRM <no-reply@grassrootsbpo.in>",
    to: email,
    subject: "Your Grassroots CRM sign-in code",
    text: `Your 6-digit code is: ${code}. It expires in 5 minutes.`,
  });
}
