import express from "express"
import speakeasy from "speakeasy"
import QRCode from "qrcode"
import path from "path"
import session from "express-session"
import bcrypt from "bcrypt"
import exp from "constants"
import { execPath } from "process"
import { userInfo } from "os"

import { UserDatabaseInterface, UserInterface } from "./UserInterface"
import { verifyToken } from "./tsVerify"
import { loginTimeMiddleware, checkSession, logoutMiddleware } from "./tsMiddlewares"


import config from "./tsKnex"
import { db, quickUpdate } from "./databaseActions"

import { error } from "console"









const app = express()
app.use(express.json())
app.use(express.urlencoded({extended: false}))
app.use(session({
    secret: "ts_secret",
    resave: false,
    saveUninitialized: false
}))








// ROUTES


app.get("/", async (req, res) => {
    let user = await db("user").where({
        username: "lazar"
    }).first("*")
    console.log(user)
    if (user){
        console.log("proso")
    }
    res.send(user)
    
})


app.route("/register")
    .get(checkSession, (req, res) => {
        res.sendFile(path.join(__dirname, "..", "public", "register.html"))
    })
    .post(checkSession, async (req, res) => {
        try {
            const header_pass = req.headers.password
            const header_username = req.headers.username
            if (!header_pass || !header_username){
                res.status(400).send("Username and password are require")
            } 
            
            const hashedPassword = await bcrypt.hash(header_pass as string, 10)
            
            let big_secret = speakeasy.generateSecret()

            try {
                let duplicate = await db("user").where({
                    username: header_username
                }).select("*")

                if (duplicate.length > 0 ) {
                    res.send("Username already exist")
                    return        
                }

            } catch(error) {
                console.log("Error in checking for username: " + error)
                res.status(404).send()
                return
            }

                    

            db("user").insert({
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
                return
            })


            res.send(`Key: ${big_secret.base32}`)
        }
        catch {
            res.status(422).send()
        }
    })



app.post("/verify", async (req, res) => {

    const token = req.headers.user_token
    const username = req.headers.username
    console.log(req.headers)

    try {
        let usr = await db("user").where({
            username: username
        }).select("*")


        console.log(usr)
        if (usr.length === 0 || usr.length > 1) {
            console.log("Username does not exits")
            res.status(404).send()
            return
        }
    
        const user_id: number = usr[0].id
        let user_secret = JSON.parse(usr[0].secret)
    
        const is_verified: boolean = verifyToken(user_secret.base32, token as string)
        if (is_verified) {
            quickUpdate("id", user_id, "verified", 1)
            .then(() => {
                res.send("User verified")
            })
    
        } else {
            res.send("Bad token")
        }
    }
    catch(error) {
        console.log("Error finding user by username: " + error)
        res.status(404).send()
        return
    }

})



app.get("/login", loginTimeMiddleware, checkSession, (req, res) => {
    res.sendFile(path.join(__dirname, "..", "public", "login.html"))
})
app.post("/login", loginTimeMiddleware, checkSession, async (req, res) => {

    const password:string = req.headers.password as string
    const token:string = req.headers.token as string



    try {
        let user = await db("user").where({
            username: req.headers.username as string
        }).select("*")
    
    
        if (user.length === 0 || user.length > 1) {
            res.status(400).send("User does not exist")
            return
        }
        else if (user[0]["login_attempts"] >= 3) {
            let current_time = Date.now()
            if (current_time >= user[0]["banned_until"]) {
                user[0].login_attempts = 0
                await quickUpdate("id", user[0].id, "login_attempts", 0)
            } else {
                res.send("User is banned. Try again later.")
                return
            } 
        }



        try {
            user[0].secret = JSON.parse(user[0].secret)
    
            const is_password_correct = await bcrypt.compare(password, user[0].password)
            if (!is_password_correct) {
                res.send("Wrond password")
            }
            else if (!user[0]["verified"]) {
                res.send("User is not verified. Go to /verify in order to verify your account.")
            }
            else {
                if (verifyToken(user[0]["secret"].base32, token)) {
                    (req.session as any).username = user[0]["username"]
                    console.log(req.session)
                    user[0].login_attempts = 0
                    await quickUpdate("id", user[0].id, "login_attempts", 0)
                    res.send("User logged in")
                }
                else {
                    let current_login_attempts = user[0]["login_attempts"]
                    user[0].login_attempts += 1
                    await quickUpdate("id", user[0].id, "login_attempts", (current_login_attempts+1))
    
                    if (user[0]["login_attempts"] >= 3) {
                        let banned_until_local = Date.now() + 1 * 60 * 1000
                        user[0]["banned_until"] = banned_until_local
                        await quickUpdate("id", user[0].id, "banned_until", banned_until_local)
                    }
                    res.status(401).send("Bad token")
                }
    
            }
    
        } catch {
            res.status(422).send()
        }


    } catch (error) {
        console.log("Login error in finding user by username: " + error)
        res.status(404).send()
    }




})


app.post("/logout", logoutMiddleware, (req, res) => {
    if ((req.session as any).username) {
        req.session.destroy((err) => {
            if (err) {
                res.send("Logout error")
                return
            }
            res.status(200).send("Logout successful")
            return
        })
    }
})
















app.listen(3000, () => {
    console.log("TYPE SCRIPT")
})