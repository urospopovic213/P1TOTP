import speakeasy from "speakeasy"
import crypto from "crypto"


export const verifyToken = (userSecret:string, token:string): boolean => {
    return speakeasy.totp.verify({
        secret: userSecret,
        encoding: "base32",
        token: token
    })
}
