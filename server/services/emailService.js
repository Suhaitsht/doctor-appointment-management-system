const nodemailer = require("nodemailer");

// ======================================================
// SMTP CONFIGURATION
// ======================================================

const isSMTPConfigured = () => {
  return Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    process.env.SMTP_FROM,
  );
};

let transporter = null;

// ======================================================
// GET SMTP TRANSPORTER
// ======================================================

const getTransporter = () => {
  if (!isSMTPConfigured()) {
    throw new Error("SMTP configuration is incomplete");
  }

  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 587);

    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,

      secure: process.env.SMTP_SECURE === "true",

      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },

      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 30000,
    });
  }

  return transporter;
};

// ======================================================
// ESCAPE HTML
// ======================================================

const escapeHtml = (value = "") => {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });
};

// ======================================================
// EMAIL TEMPLATE
// ======================================================

const createEmailTemplate = ({ title, message }) => {
  const safeTitle = escapeHtml(title);

  const safeMessage = escapeHtml(message).replace(/\n/g, "<br>");

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport"
              content="width=device-width, initial-scale=1.0" />
      </head>

      <body style="
        margin:0;
        padding:24px;
        background:#f3f6fb;
        font-family:Arial,sans-serif;
      ">

        <div style="
          max-width:600px;
          margin:auto;
          background:#ffffff;
          border-radius:12px;
          overflow:hidden;
        ">

          <div style="
            padding:24px;
            background:#0f766e;
            color:#ffffff;
            text-align:center;
          ">
            <h2 style="margin:0;">
              Jayanthi Medical Centre
            </h2>
          </div>

          <div style="padding:30px;">

            <h2 style="color:#172554;">
              ${safeTitle}
            </h2>

            <p style="
              color:#475569;
              font-size:15px;
              line-height:1.8;
            ">
              ${safeMessage}
            </p>

            <p style="
              margin-top:30px;
              color:#64748b;
              font-size:13px;
            ">
              Thank you for choosing
              Jayanthi Medical Centre.
            </p>

          </div>

          <div style="
            padding:16px;
            background:#f8fafc;
            text-align:center;
            color:#64748b;
            font-size:12px;
          ">
            Automated notification.
            Please do not reply.
          </div>

        </div>

      </body>
    </html>
  `;
};

// ======================================================
// SEND NOTIFICATION EMAIL
// ======================================================

const sendNotificationEmail = async ({ to, subject, message }) => {
  if (!to) {
    throw new Error("Recipient email is required");
  }

  if (!subject || !message) {
    throw new Error("Email subject and message are required");
  }

  const mailer = getTransporter();

  const info = await mailer.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,

    text: String(message),

    html: createEmailTemplate({
      title: subject,
      message,
    }),
  });

  console.log("Notification email accepted:", info.messageId);

  return {
    success: true,
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
  };
};

// ======================================================
// VERIFY SMTP CONNECTION
// ======================================================

const verifyEmailConnection = async () => {
  try {
    const mailer = getTransporter();

    await mailer.verify();

    console.log("SMTP connection verified successfully");

    return true;
  } catch (error) {
    console.error("SMTP verification failed:", error.message);

    return false;
  }
};

module.exports = {
  sendNotificationEmail,
  verifyEmailConnection,
  isSMTPConfigured,
};
