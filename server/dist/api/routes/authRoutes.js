"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authentication_1 = require("../middleware/authentication");
const authController_1 = require("../controllers/authController");
const router = (0, express_1.Router)();
router.route("/register").post(authController_1.register);
router.route("/login").post(authController_1.login);
router.route("/logout").delete(authentication_1.authenticateUser, authController_1.logout);
router.route("/verify-email").post(authController_1.verifyEmail);
router.route("/reset-password").post(authController_1.resetPassword);
router.route("/forgot-password").post(authController_1.forgotPassword);
exports.default = router;
