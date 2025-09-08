import nodemailer from "nodemailer";

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SUPPORT_EMAIL = "support@instantlycards.com",
  FROM_EMAIL = "no-reply@instantlycards.com",
} = process.env as Record<string, string>;

export const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT || 587),
  secure: false,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
});

export async function sendDeletionRequestMail(payload: {
  fullName: string; email: string; reason?: string;
}) {
  const { fullName, email, reason } = payload;
  const html = `
    <p><b>New account deletion request</b></p>
    <p>Name: ${fullName}</p>
    <p>Email: ${email}</p>
    <p>Reason: ${reason || "-"}</p>
  `;
  await transporter.sendMail({
    to: SUPPORT_EMAIL,
    from: FROM_EMAIL,
    subject: "Account Deletion Request",
    html,
  });
  // auto-reply to user (acknowledgement)
  await transporter.sendMail({
    to: email,
    from: FROM_EMAIL,
    subject: "We received your Instantly Cards deletion request",
    html:
      `<p>Hi ${fullName.split(" ")[0] || "there"},</p>
       <p>We’ve received your request to delete your Instantly Cards account.
       Please reply to this email from your registered address to confirm.</p>
       <p>After verification, we’ll complete deletion within 7 business days.</p>
       <p>— Instantly Cards Support</p>`,
  });
}
