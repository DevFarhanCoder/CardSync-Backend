// src/utils/mailer.ts
import nodemailer from "nodemailer";

type Env = Partial<Record<string, string>>;

type MailOpts = { to: string; subject: string; html?: string; text?: string };

export async function sendMail(opts: MailOpts) {
  // Stubbed mailer to keep build green
  console.log("sendMail (stub):", opts);
  return { ok: true };
}

const {
  SMTP_HOST,
  SMTP_PORT = "587",
  SMTP_USER,
  SMTP_PASS,
  SUPPORT_EMAIL = "developers@instantlly.com",
  FROM_EMAIL, // if not set, we'll default to SMTP_USER
} = (process.env as Env);

if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
  console.warn(
    "[mailer] Missing SMTP env. Set SMTP_HOST, SMTP_USER, SMTP_PASS (and optionally SMTP_PORT, SUPPORT_EMAIL, FROM_EMAIL)."
  );
}

export const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT),
  secure: Number(SMTP_PORT) === 465, // TLS if 587, SSL if 465
  auth: { user: SMTP_USER, pass: SMTP_PASS },
  tls: { minVersion: "TLSv1.2" },
});

export async function verifyEmailTransport() {
  try {
    await transporter.verify();
    console.log("[mailer] SMTP connection verified");
  } catch (e) {
    console.error("[mailer] SMTP verify failed:", e);
  }
}

export type DeletionRequestMail = {
  fullName: string;
  email: string;     // user's registered email
  reason?: string;
};

/**
 * Sends two emails:
 * 1) Notifies your support inbox
 * 2) Sends an acknowledgement to the user
 */
export async function sendDeletionRequestMail({
  fullName,
  email,
  reason,
}: DeletionRequestMail) {
  const from = FROM_EMAIL || SMTP_USER!;           // safer default
  const supportTo = SUPPORT_EMAIL || from;

  // 1) Notify support
  await transporter.sendMail({
    from,
    to: supportTo,
    replyTo: email,                                // replies go to user
    subject: "Account Deletion Request",
    html: `
      <p><strong>New account deletion request</strong></p>
      <p><b>Name:</b> ${escapeHtml(fullName)}</p>
      <p><b>Email:</b> ${escapeHtml(email)}</p>
      <p><b>Reason:</b> ${escapeHtml(reason || "-")}</p>
    `,
  });

  // 2) Acknowledge the user
  const first = fullName?.split(" ")[0] || "there";
  await transporter.sendMail({
    from,
    to: email,
    replyTo: supportTo,
    subject: "We received your Instantly Cards deletion request",
    html: `
      <p>Hi ${escapeHtml(first)},</p>
      <p>We’ve received your request to delete your Instantly Cards account.</p>
      <p>To confirm ownership, please reply to this email from your registered address.
         After verification, deletion will be completed within <b>7 business days</b>.</p>
      <p>— Instantly Cards Support</p>
    `,
  });
}

function escapeHtml(s: string) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
