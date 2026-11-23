import nodemailer from "nodemailer";

let transporter;

/** Creates the SMTP transporter once and reuses its connection settings. */
const getTransporter = () => {
  if (transporter) return transporter;

  const port = Number(process.env.SMTP_PORT) || 587;
  // SMTP_SERVICE (e.g. "gmail") uses nodemailer's built-in host/port presets;
  // otherwise SMTP_HOST + SMTP_PORT are used.
  const connection = process.env.SMTP_SERVICE
    ? { service: process.env.SMTP_SERVICE }
    : { host: process.env.SMTP_HOST, port, secure: port === 465 };

  transporter = nodemailer.createTransport({
    ...connection,
    auth: {
      user: process.env.SMTP_MAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });
  return transporter;
};

/** Sends an HTML e-mail. Throws if SMTP is not configured or sending fails. */
export const sendEmail = async ({ to, subject, message }) => {
  if (!process.env.SMTP_MAIL || !process.env.SMTP_PASSWORD) {
    throw new Error(
      "Email service is not configured (set SMTP_MAIL and SMTP_PASSWORD)",
    );
  }

  return getTransporter().sendMail({
    from:
      process.env.SMTP_FROM || `"FYP Management System" <${process.env.SMTP_MAIL}>`,
    to,
    subject,
    html: message,
  });
};

/**
 * For non-critical notification e-mails: logs failures instead of throwing,
 * so a broken SMTP setup never turns a successful action into an error.
 */
export const trySendEmail = async (options) => {
  try {
    await sendEmail(options);
    return true;
  } catch (error) {
    console.error(`Email to ${options.to} failed: ${error.message}`);
    return false;
  }
};
