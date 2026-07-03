import nodemailer from "nodemailer";

interface SendNotificationOptions {
  email: string;
  uploadId: string;
  fileName: string;
  status: "success" | "partial" | "failed";
  rowCount: number;
  validRows: number;
  invalidRows: number;
  downloadUrl: string;
  errorDetailsUrl: string;
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT ?? "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export async function sendUploadProcessingNotification(options: SendNotificationOptions) {
  const statusEmoji = {
    success: "✅",
    partial: "⚠️",
    failed: "❌"
  }[options.status];

  const html = `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>${statusEmoji} Traitement du fichier terminé</h2>
          <p><strong>Fichier:</strong> ${options.fileName}</p>
          <p><strong>Total de lignes:</strong> ${options.rowCount}</p>
          <p><strong>Lignes valides:</strong> <span style="color: green;"><strong>${options.validRows}</strong></span></p>
          <p><strong>Lignes invalides:</strong> <span style="color: red;"><strong>${options.invalidRows}</strong></span></p>
          
          ${options.status !== "failed" ? `
            <div style="margin-top: 20px;">
              <a href="${options.downloadUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">
                📥 Télécharger les lignes valides (CSV)
              </a>
            </div>
          ` : ""}
          
          ${options.invalidRows > 0 ? `
            <div style="margin-top: 20px;">
              <a href="${options.errorDetailsUrl}" style="display: inline-block; padding: 10px 20px; background-color: #ff9800; color: white; text-decoration: none; border-radius: 4px;">
                📋 Voir les détails des erreurs
              </a>
            </div>
          ` : ""}
        </div>
      </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || "noreply@dataflow-ci.app",
      to: options.email,
      subject: `${statusEmoji} Traitement du fichier: ${options.fileName}`,
      html
    });
  } catch (error) {
    console.error("Failed to send email notification:", error);
    throw error;
  }
}
