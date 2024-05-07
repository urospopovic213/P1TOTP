const speakeasy = require("speakeasy")

const verifyToken = (userSecret, token) => {
    return speakeasy.totp.verify({
        secret: userSecret,
        encoding: "base32",
        token: token
    })
}

module.exports = verifyToken