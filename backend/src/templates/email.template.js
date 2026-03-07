const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const buildContactEmailTemplate = ({
  name = "",
  email = "",
  phone = "",
  message = ""
}) => {
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safePhone = escapeHtml(phone || "Not provided");
  const safeMessage = escapeHtml(message);

  return {
    subject: `New Contact Message from ${name || "Unknown Sender"}`,
    text: [
      "You have received a new contact message.",
      "",
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone || "Not provided"}`,
      "",
      "Message:",
      message
    ].join("\n"),
    html: `
      <div style="margin:0;padding:24px;background-color:#f5f7fa;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827;">
          <tr>
            <td style="padding:20px 24px;border-bottom:1px solid #e5e7eb;">
              <h2 style="margin:0;font-size:18px;line-height:1.4;font-weight:600;color:#111827;">New Contact Message</h2>
              <p style="margin:6px 0 0 0;font-size:13px;line-height:1.5;color:#6b7280;">A new inquiry was submitted from your website contact form.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="padding:0 0 12px 0;font-size:13px;color:#6b7280;width:120px;">Name</td>
                  <td style="padding:0 0 12px 0;font-size:14px;color:#111827;font-weight:500;">${safeName}</td>
                </tr>
                <tr>
                  <td style="padding:0 0 12px 0;font-size:13px;color:#6b7280;">Email</td>
                  <td style="padding:0 0 12px 0;font-size:14px;color:#111827;">
                    <a href="mailto:${safeEmail}" style="color:#111827;text-decoration:none;">${safeEmail}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 0 16px 0;font-size:13px;color:#6b7280;">Phone</td>
                  <td style="padding:0 0 16px 0;font-size:14px;color:#111827;">${safePhone}</td>
                </tr>
              </table>
              <div style="margin-top:4px;padding:14px 16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">
                <p style="margin:0 0 8px 0;font-size:13px;color:#6b7280;">Message</p>
                <p style="margin:0;font-size:14px;line-height:1.7;color:#111827;white-space:normal;">${safeMessage.replace(/\n/g, "<br />")}</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 24px;background:#fafafa;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;line-height:1.5;color:#9ca3af;">This email was generated automatically from your contact form.</p>
            </td>
          </tr>
        </table>
      </div>
    `
  };
};
