"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logoutMiddleware = exports.checkSession = exports.loginTimeMiddleware = void 0;
const loginTimeMiddleware = (req, res, next) => {
    let seconds = new Date().getSeconds();
    console.log(seconds);
    if (seconds >= 35 && seconds <= 45) {
        next();
    }
    else {
        res.sendStatus(404);
    }
    // next()
};
exports.loginTimeMiddleware = loginTimeMiddleware;
const checkSession = (req, res, next) => {
    if (req.session.username) {
        res.send("Korisnik je vec ulogovan");
    }
    else {
        next();
    }
};
exports.checkSession = checkSession;
const logoutMiddleware = (req, res, next) => {
    if (!req.session.username) {
        res.send("Korisnik nije ulogovan");
    }
    else {
        next();
    }
};
exports.logoutMiddleware = logoutMiddleware;
