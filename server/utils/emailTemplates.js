/** Escapes user-controlled text before it is placed inside HTML e-mails. */
const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const footer = () => `
            <p style="color: #bbb; font-size: 12px; text-align: center; margin-top: 30px;">
                © ${new Date().getFullYear()} FYP Management System. All rights reserved.
            </p>`;

export function generateForgotPasswordEmailTemplate(
  userName,
  resetLink,
  expiresInMinutes = 15,
) {
  const safeLink = escapeHtml(resetLink);
  return `
    <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 40px 0;">
        <div style="max-width: 500px; background: #ffffff; margin: auto; padding: 30px; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">

            <h2 style="color: #333; text-align: center;">🔐 Reset Your Password</h2>

            <p style="color: #555; font-size: 15px;">Hi ${escapeHtml(userName || "User")},</p>

            <p style="color: #555; font-size: 15px;">
                We received a request to reset your password. Click the button below to set a new password.
            </p>

            <div style="text-align: center; margin: 30px 0;">
                <a href="${safeLink}"
                   style="background-color: #4CAF50; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                   Reset Password
                </a>
            </div>

            <p style="color: #777; font-size: 14px;">
                This link will expire in <strong>${expiresInMinutes} minutes</strong>. If you didn’t request a password reset, please ignore this email.
            </p>

            <hr style="margin: 25px 0;">

            <p style="color: #999; font-size: 12px;">
                If the button above doesn't work, copy and paste the following link into your browser:
            </p>

            <p style="word-break: break-all; color: #555; font-size: 13px;">
                ${safeLink}
            </p>
${footer()}
        </div>
    </div>
    `;
}

export function generateResetPasswordEmailTemplate(userName, loginUrl) {
  return `
    <div style="font-family: Arial, sans-serif; background-color: #eef2f7; padding: 40px 0;">
        <div style="max-width: 500px; background: #ffffff; margin: auto; padding: 30px; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">

            <h2 style="color: #2c3e50; text-align: center;">✅ Password Updated Successfully</h2>

            <p style="color: #555; font-size: 15px;">
                Hi ${escapeHtml(userName || "User")},
            </p>

            <p style="color: #555; font-size: 15px;">
                Your password has been successfully changed. You can now log in using your new password.
            </p>

            <div style="text-align: center; margin: 30px 0;">
                <a href="${escapeHtml(loginUrl)}"
                   style="background-color: #3498db; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                   Login Now
                </a>
            </div>

            <p style="color: #777; font-size: 14px;">
                If you did not perform this action, please contact our support immediately and secure your account.
            </p>

            <hr style="margin: 25px 0;">

            <p style="color: #999; font-size: 12px;">
                🔒 For security reasons, we recommend not sharing your password with anyone.
            </p>
${footer()}
        </div>
    </div>
    `;
}

/**
 * Request Accepted Email
 */
export function generateRequestAcceptedTemplate(supervisorName) {
  return `
    <div style="font-family: Arial; padding:20px; background:#fff; border:1px solid #ddd; border-radius:8px;">
      <h2 style="color:#10b981;">✅ Supervisor Request Accepted</h2>
      <p>Your supervisor request has been accepted by <strong>${escapeHtml(supervisorName)}</strong>.</p>
      <p>You can now start working on your project and upload files.</p>
    </div>
  `;
}

/**
 * Request Rejected Email
 */
export function generateRequestRejectedTemplate(supervisorName) {
  return `
    <div style="font-family: Arial; padding:20px; background:#fff; border:1px solid #ddd; border-radius:8px;">
      <h2 style="color:#ef4444;">❌ Supervisor Request Rejected</h2>
      <p>Your supervisor request has been rejected by <strong>${escapeHtml(supervisorName)}</strong>.</p>
      <p>You can try requesting another supervisor.</p>
    </div>
  `;
}
