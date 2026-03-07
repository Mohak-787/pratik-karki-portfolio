import express from "express";
import { body } from "express-validator";
import { contact } from "../controllers/contact.controller.js";

const router = express.Router();

/* GET /contact */
router.route("/").get((req, res) => {
  res.render("contact", { errors: [], success: null, formData: {} });
});

/* POST /contact */
router.route("/").post(
  [
    body("name")
      .trim()
      .isLength({ min: 3 })
      .withMessage("Name must be at least 3 characters long"),
    body("email").trim().isEmail().withMessage("Invalid Email"),
    body("message").trim().notEmpty().withMessage("Message is required")
  ],
  contact
);

export default router;
