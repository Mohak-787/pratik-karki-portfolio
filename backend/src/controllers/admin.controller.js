import Admin from "../models/admin.model.js";
import { validationResult } from "express-validator";
import { createAdmin } from "../services/admin.service.js";
import BlacklistToken from "../models/blacklistToken.js";
import Contact from "../models/contact.model.js";
import { createVideo } from "../services/video.service.js";
import Video from "../models/video.model.js";

const isFormRequest = (req) =>
  req.is("application/x-www-form-urlencoded") || req.is("multipart/form-data");
const isHtmlRequest = (req) => {
  const acceptHeader = (req.get("accept") || "").toLowerCase();
  return acceptHeader.includes("text/html") && !acceptHeader.includes("application/json") && !req.xhr;
};

const mapAdminSignupFormData = (req) => ({
  firstName: req.body?.name?.firstName || req.body?.firstName || "",
  lastName: req.body?.name?.lastName || req.body?.lastName || "",
  email: req.body?.email || ""
});

const mapVideoFormData = (req) => ({
  title: req.body?.title || "",
  link: req.body?.link || "",
  type: req.body?.type || "SECONDARY",
  client: req.body?.client || ""
});
const mapVideoPayload = (req) => ({
  title: (req.body?.title || "").trim(),
  link: (req.body?.link || "").trim(),
  type: req.body?.type === "PRIMARY" ? "PRIMARY" : "SECONDARY",
  client: (req.body?.client || "").trim()
});

export const adminHome = async (req, res) => {
  try {
    const videos = await Video.find({}).sort({ createdAt: -1 }).lean();

    return res.status(200).render("admin-home", {
      admin: req.admin || null,
      videos
    });
  }
  catch (error) {
    console.error("Error in adminHome controller: ", error);
    return res.status(500).render("admin-home", {
      admin: req.admin || null,
      videos: [],
      errors: [{ msg: "Unable to load videos right now." }]
    });
  }
};

export const adminVideosView = async (req, res) => {
  try {
    const videos = await Video.find({}).sort({ createdAt: -1 }).lean();

    return res.status(200).render("admin-videos", {
      admin: req.admin || null,
      videos
    });
  }
  catch (error) {
    console.error("Error in adminVideosView controller: ", error);

    return res.status(500).render("admin-videos", {
      admin: req.admin || null,
      videos: [],
      errors: [{ msg: "Unable to load videos right now." }]
    });
  }
};

export const adminVideoUploadView = async (req, res) => {
  return res.status(200).render("admin-video-upload", {
    admin: req.admin || null,
    errors: [],
    success: null,
    formData: {}
  });
};

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
      return res.redirect("/admin");
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
      return res.redirect("/admin");
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

/**
 * - Admin delete single contact controller
 * - DELETE /admin/contact/:id
 */
export const deleteContact = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;

  try {
    const contact = await Contact.findByIdAndDelete(id).lean();
    if (!contact) {
      return res.status(404).json({
        message: "Contact not found",
        success: false
      });
    }

    return res.status(200).json({
      message: "Contact deleted successfully",
      contact,
      success: true
    });
  }
  catch (error) {
    console.error("Error in deleteContact(admin) controller: ", error);
    return res.status(500).json({
      message: `Internal server error: ${error.message}`,
      success: false
    });
  }
};

/**
 * - Admin delete multiple contacts controller
 * - DELETE /admin/contacts
 */
export const deleteContactsBulk = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];

  try {
    const result = await Contact.deleteMany({ _id: { $in: ids } });

    return res.status(200).json({
      message: `${result.deletedCount || 0} contact(s) deleted successfully`,
      deletedCount: result.deletedCount || 0,
      success: true
    });
  }
  catch (error) {
    console.error("Error in deleteContactsBulk(admin) controller: ", error);
    return res.status(500).json({
      message: `Internal server error: ${error.message}`,
      success: false
    });
  }
};

/**
 * - Admin video controller
 * - POST /admin/video
 */
export const videos = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    if (isFormRequest(req)) {
      return res.status(400).render("admin-video-upload", {
        admin: req.admin || null,
        errors: errors.array(),
        success: null,
        formData: mapVideoFormData(req)
      });
    }

    return res.status(400).json({ errors: errors.array() });
  }

  const { title, link, type, client } = req.body;

  try {
    const video = await createVideo({
      title, link, type, client
    });

    if (isFormRequest(req)) {
      return res.status(201).render("admin-video-upload", {
        admin: req.admin || null,
        errors: [],
        success: "Video uploaded successfully",
        formData: {}
      });
    }

    res.status(201).json({
      message: "Video uploaded successfully",
      video,
      success: true
    })
  }
  catch (error) {
    console.error("Error in videos(admin) controller: ", error);

    if (isFormRequest(req)) {
      return res.status(500).render("admin-video-upload", {
        admin: req.admin || null,
        errors: [{ msg: error.message || "Internal server error" }],
        success: null,
        formData: mapVideoFormData(req)
      });
    }

    res.status(500).json({
      message: `Internal server error: ${error.message}`,
      success: false
    });
  }
}

/**
 * - Admin update video controller
 * - PUT /admin/video/:id
 */
export const updateVideo = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const payload = mapVideoPayload(req);

  try {
    const video = await Video.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true
    }).lean();

    if (!video) {
      return res.status(404).json({
        message: "Video not found",
        success: false
      });
    }

    return res.status(200).json({
      message: "Video updated successfully",
      video,
      success: true
    });
  }
  catch (error) {
    console.error("Error in updateVideo(admin) controller: ", error);
    return res.status(500).json({
      message: `Internal server error: ${error.message}`,
      success: false
    });
  }
};

/**
 * - Admin delete video controller
 * - DELETE /admin/video/:id
 */
export const deleteVideo = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;

  try {
    const video = await Video.findByIdAndDelete(id).lean();

    if (!video) {
      return res.status(404).json({
        message: "Video not found",
        success: false
      });
    }

    return res.status(200).json({
      message: "Video deleted successfully",
      video,
      success: true
    });
  }
  catch (error) {
    console.error("Error in deleteVideo(admin) controller: ", error);
    return res.status(500).json({
      message: `Internal server error: ${error.message}`,
      success: false
    });
  }
};

/**
 * - Admin primary videos controller
 * - GET /admin/primary-videos
 */
export const primaryVideos = async (req, res) => {
  try {
    const videos = await Video.find({ type: "PRIMARY" });

    if (videos.length === 0) {
      return res.status(200).json({
        message: "No primary videos",
        videos: [],
        success: true
      });
    }

    res.status(200).json({
      message: "Primary videos fetched successfully",
      videos,
      success: true
    });
  }
  catch (error) {
    console.error("Error in primaryVideos(admin) controller: ", error);
    res.status(500).json({
      message: `Internal server error: ${error.message}`,
      success: false
    });
  }
}

/**
 * - Admin secondary videos controller
 * - GET /admin/secondary-videos
 */
export const secondaryVideos = async (req, res) => {
  try {
    const videos = await Video.find({ type: "SECONDARY" });

    if (videos.length === 0) {
      return res.status(200).json({
        message: "No secondary videos",
        videos: [],
        success: true
      });
    }

    res.status(200).json({
      message: "Secondary videos fetched successfully",
      videos,
      success: true
    });
  }
  catch (error) {
    console.error("Error in secondaryVideos(admin) controller: ", error);
    res.status(500).json({
      message: `Internal server error: ${error.message}`,
      success: false
    });
  }
}
