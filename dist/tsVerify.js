"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = void 0;
const speakeasy_1 = __importDefault(require("speakeasy"));
const verifyToken = (userSecret, token) => {
    return speakeasy_1.default.totp.verify({
        secret: userSecret,
        encoding: "base32",
        token: token
    });
};
exports.verifyToken = verifyToken;
