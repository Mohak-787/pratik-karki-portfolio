import { validationResult } from "express-validator";
import { createContact } from "../services/contact.service.js";
import { sendEmail } from "../services/email.service.js";
import { buildContactEmailTemplate } from "../templates/email.template.js";

const isFormRequest = (req) =>
  req.is("application/x-www-form-urlencoded") || req.is("multipart/form-data");

/**
 * - Contact controller
 * - POST /contact
 */
export const contact = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    if (isFormRequest(req)) {
      return res.status(400).render("contact", {
        errors: errors.array(),
        success: null,
        formData: {
          name: req.body?.name || "",
          email: req.body?.email || "",
          phone: req.body?.phone || "",
          message: req.body?.message || ""
        }
      });
    }

    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, phone, message } = req.body;

  try {
    await createContact({
      name, email, phone, message
    });

    const emailTemplate = buildContactEmailTemplate({
      name,
      email,
      phone,
      message,
      submittedAt: new Date()
    });

    sendEmail(
      process.env.CONTACT_RECEIVER_EMAIL,
      emailTemplate.subject,
      emailTemplate.text,
      emailTemplate.html
    ).catch((emailError) => {
      console.error("Failed to send contact notification email:", emailError);
    });

    if (isFormRequest(req)) {
      return res.status(201).render("contact", {
        errors: [],
        success: "Message sent successfully",
        formData: {}
      });
    }

    return res.status(201).json({
      message: "Message sent successfully",
      success: true
    })
  }
  catch (error) {
    console.error("Error in contact controller: ", error);
    if (isFormRequest(req)) {
      return res.status(500).render("contact", {
        errors: [{ msg: "Internal server error" }],
        success: null,
        formData: {
          name: req.body?.name || "",
          email: req.body?.email || "",
          phone: req.body?.phone || "",
          message: req.body?.message || ""
        }
      });
    }

    res.status(500).json({
      message: `Internal server error: ${error.message}`,
      success: false
    });
  }
}
