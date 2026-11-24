"use strict";

const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, text, html }) => {
  const port = Number(process.env.SMTP_PORT || 465);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,

    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },

    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 20000,

    tls: {
      servername: process.env.SMTP_HOST,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject,
      text,
      html,
    });

    console.log("EMAIL ACCEPTED:", info.messageId);

    return info;
  } catch (error) {
    console.error("SMTP EMAIL ERROR:", {
      code: error.code,
      command: error.command,
      message: error.message,
    });

    throw error;
  }
};

module.exports = sendEmail;
