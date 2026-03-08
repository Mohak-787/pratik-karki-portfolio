const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const cleanPhoneHref = (value = "") => String(value).replace(/[^\d+]/g, "");

const formatSubmittedAt = (dateValue) => {
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue || Date.now());
  if (Number.isNaN(date.getTime())) {
    return "Just now";
  }

  return date.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  });
};

export const buildContactEmailTemplate = ({
  name = "",
  email = "",
  phone = "",
  message = "",
  submittedAt = new Date()
}) => {
  const safeName = escapeHtml(name || "Unknown Sender");
  const safeEmail = escapeHtml(email || "Not provided");
  const safePhoneText = escapeHtml(phone || "Not provided");
  const safeMessage = escapeHtml(message || "");
  const safeSubmittedAt = escapeHtml(formatSubmittedAt(submittedAt));
  const safePhoneHref = cleanPhoneHref(phone);

  const subject = `New Project Inquiry: ${name || "Unknown Sender"}`;

  return {
    subject,
    text: [
      "NEW WEBSITE INQUIRY",
      "",
      "A new client inquiry was submitted for your video editing / filmmaking services.",
      "",
      `Submitted: ${formatSubmittedAt(submittedAt)}`,
      `Name: ${name || "Unknown Sender"}`,
      `Email: ${email || "Not provided"}`,
      `Phone: ${phone || "Not provided"}`,
      "",
      "Message:",
      message || "(No message provided)",
      "",
      "Quick actions:",
      `- Reply by email: ${email || "N/A"}`,
      `- Call: ${phone || "N/A"}`
    ].join("\n"),
    html: `
      <div style="margin:0;padding:0;background-color:#0b1220;">
        <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
          New filmmaking inquiry received. Review client brief and respond quickly.
        </div>

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#0b1220;padding:28px 10px;">
          <tr>
            <td align="center">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:680px;font-family:Arial,Helvetica,sans-serif;color:#111827;">
                <tr>
                  <td style="padding:0 0 12px 0;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:linear-gradient(135deg,#101827 0%,#162440 100%);border:1px solid #2f446d;border-radius:14px;">
                      <tr>
                        <td style="padding:22px 24px;">
                          <p style="margin:0;font-size:11px;letter-spacing:1.3px;text-transform:uppercase;color:#93c5fd;">Studio Notification</p>
                          <h1 style="margin:8px 0 0 0;font-size:24px;line-height:1.25;color:#f8fafc;">New Project Inquiry</h1>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding:0;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#101827;border:1px solid #2f446d;border-radius:14px;">
                      <tr>
                        <td style="padding:24px 24px 18px 24px;">
                          <p style="margin:0;font-size:12px;line-height:1.5;color:#93a4bf;">Submitted</p>
                          <p style="margin:4px 0 0 0;font-size:14px;line-height:1.5;color:#f8fafc;font-weight:600;">${safeSubmittedAt}</p>

                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:18px;border-collapse:collapse;">
                            <tr>
                              <td style="padding:10px 0;border-bottom:1px solid #223150;width:130px;font-size:12px;line-height:1.5;color:#93a4bf;">Client Name</td>
                              <td style="padding:10px 0;border-bottom:1px solid #223150;font-size:14px;line-height:1.5;color:#f8fafc;font-weight:600;">${safeName}</td>
                            </tr>
                            <tr>
                              <td style="padding:10px 0;border-bottom:1px solid #223150;font-size:12px;line-height:1.5;color:#93a4bf;">Email</td>
                              <td style="padding:10px 0;border-bottom:1px solid #223150;font-size:14px;line-height:1.5;color:#f8fafc;">
                                <a href="mailto:${safeEmail}" style="color:#7dd3fc;text-decoration:none;">${safeEmail}</a>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:10px 0 0 0;font-size:12px;line-height:1.5;color:#93a4bf;">Phone</td>
                              <td style="padding:10px 0 0 0;font-size:14px;line-height:1.5;color:#f8fafc;">
                                ${safePhoneHref ? `<a href="tel:${escapeHtml(safePhoneHref)}" style="color:#7dd3fc;text-decoration:none;">${safePhoneText}</a>` : safePhoneText}
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:0 24px 24px 24px;">
                          <div style="border:1px solid #2f446d;border-radius:12px;background:#0f172a;padding:14px 16px;">
                            <p style="margin:0 0 8px 0;font-size:12px;line-height:1.4;text-transform:uppercase;letter-spacing:0.7px;color:#93a4bf;">Client Brief</p>
                            <p style="margin:0;font-size:14px;line-height:1.8;color:#e2e8f0;">${safeMessage.replace(/\n/g, "<br />") || "(No message provided)"}</p>
                          </div>
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:0 24px 24px 24px;">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="padding:0 10px 0 0;">
                                <a href="mailto:${safeEmail}" style="display:inline-block;background:#0f4c81;color:#ffffff;text-decoration:none;font-size:13px;font-weight:700;line-height:1;padding:11px 16px;border-radius:9px;">Reply by Email</a>
                              </td>
                              <td style="padding:0;">
                                ${safePhoneHref ? `<a href="tel:${escapeHtml(safePhoneHref)}" style="display:inline-block;background:#0b1220;color:#ffffff;text-decoration:none;font-size:13px;font-weight:700;line-height:1;padding:11px 16px;border-radius:9px;">Call Client</a>` : ""}
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding:12px 6px 0 6px;">
                    <p style="margin:0;font-size:11px;line-height:1.6;color:#93a4bf;text-align:center;">
                      This notification was generated automatically from your website contact form.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
    `
  };
};
