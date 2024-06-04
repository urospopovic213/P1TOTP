const speakeasy = require("speakeasy")
const crypto = require("crypto")

const verifyToken = (userSecret, token) => {
    return speakeasy.totp.verify({
        secret: userSecret,
        encoding: "base32",
        token: token
    })
}

module.exports = verifyToken


const users = ["jfsajfoidsj", "dfhdsioa"]


const generateUsername = () => {

    let username = crypto.randomUUID()

    for (const u of users) {
        if (username === u) 
            username = generateUsername()
    }
    return username

}