import Admin from "../models/admin.model.js";
import { validationResult } from "express-validator";
import { createAdmin } from "../services/admin.service.js";
import BlacklistToken from "../models/blacklistToken.js";
import Contact from "../models/contact.model.js";

const isFormRequest = (req) =>
  req.is("application/x-www-form-urlencoded") || req.is("multipart/form-data");
const isHtmlRequest = (req) => req.accepts("html") && !req.xhr;

const mapAdminSignupFormData = (req) => ({
  firstName: req.body?.name?.firstName || req.body?.firstName || "",
  lastName: req.body?.name?.lastName || req.body?.lastName || "",
  email: req.body?.email || ""
});

/**
 * - Admin signup controller
 * - POST /admin/signup 
 */
export const adminSignup = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    if (isFormRequest(req)) {
      return res.status(400).render("admin-signup", {
        errors: errors.array(),
        success: null,
        formData: mapAdminSignupFormData(req)
      });
    }

    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password } = req.body;

  try {
    const existingUser = await Admin.findOne({ email });
    if (existingUser) {
      if (isFormRequest(req)) {
        return res.status(400).render("admin-signup", {
          errors: [{ msg: "Email already in use" }],
          success: null,
          formData: mapAdminSignupFormData(req)
        });
      }

      return res.status(400).json({
        message: "Email already in use",
        success: false
      });
    }

    const hashedPassword = await Admin.hashPassword(password);
    const admin = await createAdmin({
      firstName: name.firstName,
      lastName: name.lastName,
      email,
      password: hashedPassword
    });

    const token = admin.generateAuthToken();

    const adminObj = admin.toObject();
    delete adminObj.password;

    res.cookie("token", token);

    if (isFormRequest(req)) {
      return res.redirect("/admin/contacts");
    }

    return res.status(201).json({
      message: "Admin created successfully",
      admin: adminObj,
      success: true
    });
  }
  catch (error) {
    console.error("Error in adminSignup controller: ", error);
    if (isFormRequest(req)) {
      return res.status(500).render("admin-signup", {
        errors: [{ msg: "Internal server error" }],
        success: null,
        formData: mapAdminSignupFormData(req)
      });
    }

    res.status(500).json({
      message: `Internal server error: ${error.message}`,
      success: false
    });
  }
}

/**
 * - Admin login controller
 * - POST /admin/login
 */
export const adminLogin = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    if (isFormRequest(req)) {
      return res.status(400).render("admin-login", {
        errors: errors.array(),
        success: null,
        formData: { email: req.body?.email || "" }
      });
    }

    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;
  if (!email || !password) {
    if (isFormRequest(req)) {
      return res.status(400).render("admin-login", {
        errors: [{ msg: "All fields are required" }],
        success: null,
        formData: { email: email || "" }
      });
    }

    return res.status(400).json({
      message: "All fields are required",
      success: false
    });
  }

  try {
    const admin = await Admin.findOne({ email }).select("+password");
    if (!admin) {
      if (isFormRequest(req)) {
        return res.status(401).render("admin-login", {
          errors: [{ msg: "Invalid Credentials" }],
          success: null,
          formData: { email: email || "" }
        });
      }

      return res.status(401).json({
        message: "Invalid Credentials",
        success: false
      });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      if (isFormRequest(req)) {
        return res.status(401).render("admin-login", {
          errors: [{ msg: "Invalid Credentials" }],
          success: null,
          formData: { email: email || "" }
        });
      }

      return res.status(401).json({
        message: "Invalid Credentials",
        success: false
      });
    }

    const token = admin.generateAuthToken();

    const adminObj = admin.toObject();
    delete adminObj.password;

    res.cookie("token", token);

    if (isFormRequest(req)) {
      return res.redirect("/admin/contacts");
    }

    return res.status(200).json({
      message: "Admin login successfully",
      admin: adminObj,
      success: true
    });
  }
  catch (error) {
    console.error("Error in adminLogin controller: ", error);
    if (isFormRequest(req)) {
      return res.status(500).render("admin-login", {
        errors: [{ msg: "Internal server error" }],
        success: null,
        formData: { email: req.body?.email || "" }
      });
    }

    res.status(500).json({
      message: `Internal server error: ${error.message}`,
      success: false
    });
  }
}

/**
 * - Admin logout controller
 * - POST /admin/logout
 */
export const adminLogout = async (req, res) => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

    res.clearCookie("token");

    if (token) {
      await BlacklistToken.create({ token });
    }

    if (isFormRequest(req)) {
      return res.status(200).render("admin-login", {
        errors: [],
        success: "Logged out successfully",
        formData: {}
      });
    }

    res.status(200).json({
      message: "Logged out successfully",
      success: true
    });
  }
  catch (error) {
    console.error("Error in adminLogout controller: ", error);
    res.status(500).json({
      message: `Internal server error: ${error.message}`,
      success: false
    });
  }
}

/**
 * - Admin contacts controller
 * - GET /admin/contacts
 */
export const contacts = async (req, res) => {
  try {
    const contactList = await Contact.find({}).sort({ createdAt: -1 }).lean();

    if (isHtmlRequest(req)) {
      return res.status(200).render("admin-contacts", {
        contacts: contactList,
        admin: req.admin || null
      });
    }

    res.status(200).json({
      message: "Successfully fetched contacts",
      contacts: contactList,
      success: true
    });
  }
  catch (error) {
    console.error("Error in contacts controller: ", error);
    res.status(500).json({
      message: `Internal server error: ${error.message}`,
      success: false
    });
  }
}
