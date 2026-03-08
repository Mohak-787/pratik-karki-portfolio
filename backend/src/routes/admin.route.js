import express from "express";
import {
  adminSignup,
  adminLogin,
  adminLogout,
  contacts,
  deleteContact,
  deleteContactsBulk,
  videos,
  updateVideo,
  deleteVideo,
  primaryVideos,
  secondaryVideos,
  adminHome,
  adminVideosView,
  adminVideoUploadView
} from "../controllers/admin.controller.js";
import { body, param } from "express-validator";
import {
  normalizeAdminSignupForm,
  normalizeAdminLoginForm
} from "../middlewares/form-normalizer.middleware.js";
import { authAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

/* GET /admin/signup */
router.route("/signup").get((req, res) => {
  res.render("admin-signup", { errors: [], success: null, formData: {} });
});

/* POST /admin/signup */
router.route("/signup").post(
  normalizeAdminSignupForm,
  [
    body("email").trim().isEmail().withMessage("Invalid Email"),
    body("name.firstName")
      .trim()
      .isLength({ min: 3 })
      .withMessage("First name must be at least 3 characters long"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long")
  ],
  adminSignup
);

/* GET /admin/login */
router.route("/login").get((req, res) => {
  res.render("admin-login", { errors: [], success: null, formData: {} });
});

/* POST /admin/login */
router.route("/login").post(
  normalizeAdminLoginForm,
  [
    body("email").trim().isEmail().withMessage("Invalid Email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long")
  ],
  adminLogin
);

/* Apply admin auth middleware to the routes below */
router.use(authAdmin);

/* GET /admin */
router.route("/").get(adminHome);

/* GET /admin/home */
router.route("/home").get(adminHome);

/* POST /admin/logout */
router.route("/logout").post(adminLogout);

/* GET /admin/contacts */
router.route("/contacts").get(contacts).delete([
  body("ids").isArray({ min: 1 }).withMessage("At least one contact id is required"),
  body("ids.*").isMongoId().withMessage("Invalid contact id")
], deleteContactsBulk);

/* DELETE /admin/contact/:id */
router.route("/contact/:id").delete([
  param("id").isMongoId().withMessage("Valid contact id is required")
], deleteContact);

/* GET /admin/videos */
router.route("/videos").get(adminVideosView);

/* GET + POST /admin/video */
router.route("/video").get(adminVideoUploadView).post([
  body("title").trim().notEmpty().withMessage("Video title is required"),
  body("link").trim().isURL().withMessage("Valid video URL is required"),
  body("type").isIn(["PRIMARY", "SECONDARY"]).withMessage("Video type is required")
], videos);

/* PUT + DELETE /admin/video/:id */
router.route("/video/:id").put([
  param("id").isMongoId().withMessage("Valid video id is required"),
  body("title").trim().notEmpty().withMessage("Video title is required"),
  body("link").trim().isURL().withMessage("Valid video URL is required"),
  body("type").isIn(["PRIMARY", "SECONDARY"]).withMessage("Video type is required")
], updateVideo).delete([
  param("id").isMongoId().withMessage("Valid video id is required")
], deleteVideo);

/* GET /admin/primary-videos */
router.route("/primary-videos").get(primaryVideos);

/* GET /admin/secondary-videos */
router.route("/secondary-videos").get(secondaryVideos);

export default router;
