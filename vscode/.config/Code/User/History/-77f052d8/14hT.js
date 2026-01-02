const express = require("express");
const { signup, login, profile } = require("../controllers/authController");
const { body } = require("express-validator");
const auth = require("../middleware/auth");
const router = express.Router();

router.post(
  "/signup",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Invalid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
  ],
  signup
);
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Invalid email"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  login
);
router.get("/profile", auth, profile);

module.exports = router;
