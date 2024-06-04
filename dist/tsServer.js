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
const speakeasy_1 = __importDefault(require("speakeasy"));
const path_1 = __importDefault(require("path"));
const express_session_1 = __importDefault(require("express-session"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const tsVerify_1 = require("./tsVerify");
const tsMiddlewares_1 = require("./tsMiddlewares");
const databaseActions_1 = require("./databaseActions");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
app.use((0, express_session_1.default)({
    secret: "ts_secret",
    resave: false,
    saveUninitialized: false
}));
// ROUTES
app.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let user = yield (0, databaseActions_1.db)("user").where({
        username: "lazar"
    }).first("*");
    console.log(user);
    if (user) {
        console.log("proso");
    }
    res.send(user);
}));
app.route("/register")
    .get(tsMiddlewares_1.checkSession, (req, res) => {
    res.sendFile(path_1.default.join(__dirname, "..", "public", "register.html"));
})
    .post(tsMiddlewares_1.checkSession, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const header_pass = req.headers.password;
        const header_username = req.headers.username;
        if (!header_pass || !header_username) {
            res.status(400).send("Username and password are require");
        }
        const hashedPassword = yield bcrypt_1.default.hash(header_pass, 10);
        let big_secret = speakeasy_1.default.generateSecret();
        try {
            let duplicate = yield (0, databaseActions_1.db)("user").where({
                username: header_username
            }).select("*");
            if (duplicate.length > 0) {
                res.send("Username already exist");
                return;
            }
        }
        catch (error) {
            console.log("Error in checking for username: " + error);
            res.status(404).send();
            return;
        }
        (0, databaseActions_1.db)("user").insert({
            username: header_username,
            password: hashedPassword,
            "secret": {
                ascii: big_secret.ascii,
                hex: big_secret.hex,
                base32: big_secret.base32,
            },
            verified: false,
            login_attempts: 0,
            banned_until: 0
        })
            .then((result) => {
            console.log("User successfully added: ", result);
        })
            .catch((error) => {
            console.error("An error occurred while adding a user: ", error);
            return;
        });
        res.send(`Key: ${big_secret.base32}`);
    }
    catch (_a) {
        res.status(422).send();
    }
}));
app.post("/verify", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const token = req.headers.user_token;
    const username = req.headers.username;
    console.log(req.headers);
    try {
        let usr = yield (0, databaseActions_1.db)("user").where({
            username: username
        }).select("*");
        console.log(usr);
        if (usr.length === 0 || usr.length > 1) {
            console.log("Username does not exits");
            res.status(404).send();
            return;
        }
        const user_id = usr[0].id;
        let user_secret = JSON.parse(usr[0].secret);
        const is_verified = (0, tsVerify_1.verifyToken)(user_secret.base32, token);
        if (is_verified) {
            (0, databaseActions_1.quickUpdate)("id", user_id, "verified", 1)
                .then(() => {
                res.send("User verified");
            });
        }
        else {
            res.send("Bad token");
        }
    }
    catch (error) {
        console.log("Error finding user by username: " + error);
        res.status(404).send();
        return;
    }
}));
app.get("/login", tsMiddlewares_1.loginTimeMiddleware, tsMiddlewares_1.checkSession, (req, res) => {
    res.sendFile(path_1.default.join(__dirname, "..", "public", "login.html"));
});
app.post("/login", tsMiddlewares_1.loginTimeMiddleware, tsMiddlewares_1.checkSession, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const password = req.headers.password;
    const token = req.headers.token;
    try {
        let user = yield (0, databaseActions_1.db)("user").where({
            username: req.headers.username
        }).select("*");
        if (user.length === 0 || user.length > 1) {
            res.status(400).send("User does not exist");
            return;
        }
        else if (user[0]["login_attempts"] >= 3) {
            let current_time = Date.now();
            if (current_time >= user[0]["banned_until"]) {
                user[0].login_attempts = 0;
                yield (0, databaseActions_1.quickUpdate)("id", user[0].id, "login_attempts", 0);
            }
            else {
                res.send("User is banned. Try again later.");
                return;
            }
        }
        try {
            user[0].secret = JSON.parse(user[0].secret);
            const is_password_correct = yield bcrypt_1.default.compare(password, user[0].password);
            if (!is_password_correct) {
                res.send("Wrond password");
            }
            else if (!user[0]["verified"]) {
                res.send("User is not verified. Go to /verify in order to verify your account.");
            }
            else {
                if ((0, tsVerify_1.verifyToken)(user[0]["secret"].base32, token)) {
                    req.session.username = user[0]["username"];
                    console.log(req.session);
                    user[0].login_attempts = 0;
                    yield (0, databaseActions_1.quickUpdate)("id", user[0].id, "login_attempts", 0);
                    res.send("User logged in");
                }
                else {
                    let current_login_attempts = user[0]["login_attempts"];
                    user[0].login_attempts += 1;
                    yield (0, databaseActions_1.quickUpdate)("id", user[0].id, "login_attempts", (current_login_attempts + 1));
                    if (user[0]["login_attempts"] >= 3) {
                        let banned_until_local = Date.now() + 1 * 60 * 1000;
                        user[0]["banned_until"] = banned_until_local;
                        yield (0, databaseActions_1.quickUpdate)("id", user[0].id, "banned_until", banned_until_local);
                    }
                    res.status(401).send("Bad token");
                }
            }
        }
        catch (_b) {
            res.status(422).send();
        }
    }
    catch (error) {
        console.log("Login error in finding user by username: " + error);
        res.status(404).send();
    }
}));
app.post("/logout", tsMiddlewares_1.logoutMiddleware, (req, res) => {
    if (req.session.username) {
        req.session.destroy((err) => {
            if (err) {
                res.send("Logout error");
                return;
            }
            res.status(200).send("Logout successful");
            return;
        });
    }
});
app.listen(3000, () => {
    console.log("TYPE SCRIPT");
});
