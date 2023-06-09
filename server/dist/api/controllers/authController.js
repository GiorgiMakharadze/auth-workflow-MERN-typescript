"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.forgotPassword = exports.logout = exports.login = exports.verifyEmail = exports.register = void 0;
const http_status_codes_1 = require("http-status-codes");
const crypto_1 = __importDefault(require("crypto"));
const User_1 = __importDefault(require("../models/User"));
const Token_1 = __importDefault(require("../models/Token"));
const utils_1 = require("../../utils");
const errors_1 = require("../errors");
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, name, password } = req.body;
    const emailAlreadyExists = yield User_1.default.findOne({ email });
    if (emailAlreadyExists) {
        throw new errors_1.BadRequestError("Email already exists");
    }
    //first registered user is an admin!
    const isFirstAccount = (yield User_1.default.countDocuments({})) === 0;
    const role = isFirstAccount ? "admin" : "user";
    const verificationToken = crypto_1.default.randomBytes(40).toString("hex");
    const user = yield User_1.default.create({
        name,
        email,
        password,
        role,
        verificationToken,
    });
    const origin = "http://localhost:3000";
    yield (0, utils_1.sendVerificationEmail)({
        name: user.name,
        email: user.email,
        verificationToken: user.verificationToken,
        origin,
    });
    res.status(http_status_codes_1.StatusCodes.CREATED).json({
        msg: "Please check your email to verify account",
    });
});
exports.register = register;
const verifyEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { verificationToken, email } = req.body;
    const user = yield User_1.default.findOne({ email });
    if (!user) {
        throw new errors_1.UnauthenticatedError("Verification failed");
    }
    if (user.verificationToken !== verificationToken) {
        throw new errors_1.UnauthenticatedError("Verification failed");
    }
    user.isVerified = true;
    user.verified = new Date(Date.now());
    user.verificationToken = "";
    yield user.save();
    res.status(http_status_codes_1.StatusCodes.OK).json({ msg: "Email Verified" });
});
exports.verifyEmail = verifyEmail;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    if (!email || !password) {
        throw new errors_1.BadRequestError("Please provide email and passwrod");
    }
    const user = yield User_1.default.findOne({ email });
    if (!user) {
        throw new errors_1.UnauthenticatedError("Invalid Credentials");
    }
    const isPasswordCorrect = yield user.comparePassword(password);
    if (!isPasswordCorrect) {
        throw new errors_1.UnauthenticatedError("Invalid Credentials");
    }
    if (!user.isVerified) {
        throw new errors_1.UnauthenticatedError("Please verify your email");
    }
    const tokenUser = (0, utils_1.createTokenUser)(user);
    //create refresh token
    let refreshToken = "";
    //check for existing token
    const existingToken = yield Token_1.default.findOne({ user: user._id });
    if (existingToken) {
        const { isValid } = existingToken;
        if (!isValid) {
            throw new errors_1.UnauthenticatedError("Invalid Credentials");
        }
        refreshToken = existingToken.refreshToken;
        (0, utils_1.attachCookiesToResponse)({ res, user: tokenUser, refreshToken });
        res.status(http_status_codes_1.StatusCodes.OK).json({ user: tokenUser });
        return;
    }
    refreshToken = crypto_1.default.randomBytes(40).toString("hex");
    const userAgent = req.headers["user-agent"];
    const ip = req.ip;
    const userToken = { refreshToken, ip, userAgent, user: user._id };
    yield Token_1.default.create(userToken);
    (0, utils_1.attachCookiesToResponse)({ res, user: tokenUser, refreshToken });
    res.status(http_status_codes_1.StatusCodes.OK).json({ user: tokenUser });
});
exports.login = login;
const logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    yield Token_1.default.findOneAndDelete({ user: (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId });
    res.cookie("accessToken", "logout", {
        httpOnly: true,
        expires: new Date(Date.now()),
    });
    res.cookie("refreshToken", "logout", {
        httpOnly: true,
        expires: new Date(Date.now()),
    });
    res.status(http_status_codes_1.StatusCodes.OK).json({ msg: "user logged out" });
});
exports.logout = logout;
const forgotPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    if (!email) {
        throw new errors_1.BadRequestError("Please provide valid emial");
    }
    const user = yield User_1.default.findOne({ email });
    if (user) {
        const passwordToken = crypto_1.default.randomBytes(40).toString("hex");
        const origin = "http://localhost:3000";
        yield (0, utils_1.sendResetPasswordEmail)({
            name: user.name,
            email: user.email,
            token: passwordToken,
            origin,
        });
        const tenMinutes = 1000 * 60 * 10;
        const passwordTokenExpirationDate = new Date(Date.now() + tenMinutes);
        user.passwordToken = (0, utils_1.hashString)(passwordToken);
        user.passwordTokenExpirationDate = passwordTokenExpirationDate;
        yield user.save();
    }
    res
        .status(http_status_codes_1.StatusCodes.OK)
        .json({ msg: "Please check your email for reset password link" });
});
exports.forgotPassword = forgotPassword;
const resetPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { token, email, password } = req.body;
    if (!token || !email || !password) {
        throw new errors_1.BadRequestError("Please provide all values");
    }
    const user = yield User_1.default.findOne({ email });
    if (user) {
        const currentDate = new Date();
        if (user.passwordToken === (0, utils_1.hashString)(token) &&
            user.passwordTokenExpirationDate > currentDate) {
            user.password = password;
            user.passwordToken = null;
            user.passwordTokenExpirationDate = null;
            yield user.save();
        }
    }
    res.send("reset password");
});
exports.resetPassword = resetPassword;
