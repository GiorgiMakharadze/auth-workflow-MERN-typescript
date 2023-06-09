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
const express_1 = __importDefault(require("express"));
require("dotenv/config");
require("express-async-errors");
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const helmet_1 = __importDefault(require("helmet"));
const xss_clean_1 = __importDefault(require("xss-clean"));
const cors_1 = __importDefault(require("cors"));
const express_mongo_sanitize_1 = __importDefault(require("express-mongo-sanitize"));
const connect_1 = require("./api/db/connect");
const not_found_1 = require("./api/middleware/not-found");
const error_handler_1 = require("./api/middleware/error-handler");
const authRoutes_1 = __importDefault(require("./api/routes/authRoutes"));
const userRoutes_1 = __importDefault(require("./api/routes/userRoutes"));
const port = process.env.PORT || 5000;
const app = (0, express_1.default)();
//security
app.set("trust proxy", 1);
app.use((0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 60,
}));
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use((0, xss_clean_1.default)());
app.use((0, express_mongo_sanitize_1.default)());
//middlewares
app.use((0, morgan_1.default)("dev"));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)(process.env.JWT_SECRET));
//routes
app.get("/", (req, res) => {
    res.send("auth workflow");
});
app.use("/api/v1/auth", authRoutes_1.default);
app.use("/api/v1/users", userRoutes_1.default);
//error handler middlewares
app.use(not_found_1.notFound);
app.use(error_handler_1.errorHandlerMiddleware);
const start = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, connect_1.connectDB)(process.env.MONGO_URL);
        app.listen(port, () => {
            console.log(`Server is listening on port: ${port}...`);
        });
    }
    catch (error) {
        console.log(error);
    }
});
start();
