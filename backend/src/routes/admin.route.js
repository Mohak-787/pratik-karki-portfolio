import express from "express";
import {
  adminSignup,
  adminLogin,
  adminLogout,
  contacts
} from "../controllers/admin.controller.js";
import { body } from "express-validator";
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

/* POST /admin/logout */
router.route("/logout").post(adminLogout);

/* GET /admin/contacts */
router.route("/contacts").get(contacts);

export default router;
