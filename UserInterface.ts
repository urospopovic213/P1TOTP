import { Request, Response, NextFunction } from "express"



export interface UserInterface {
    username: string,
    password: string,
    secret: {
        ascii: string,
        hex: string,
        base32: string,
        // otpauth_url: string
    },
    verified: boolean,
    loginAttempts: number,
    bannedUntil: number
}






export interface UserDatabaseInterface {
    username: string,
    password: string,
    secret: any,
    verified: boolean,
    loginAttempts: number,
    bannedUntil: number
}



export interface FixHeader extends Request {
    password: string,
    username: string
}