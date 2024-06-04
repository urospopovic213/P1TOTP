import express from "express"
// import speakeasy from "speakeasy"
// import QRCode from "qrcode"
import path from "path"
import session from "express-session"
// import bcrypt from "bcrypt"
// import exp from "constants"
// import { execPath } from "process"
// import { userInfo } from "os"

// import { UserDatabaseInterface, UserInterface } from "../interfaces/UserInterface"
// import { verifyToken } from "../helpers/tsVerify"
import { loginTimeMiddleware, checkSession, logoutMiddleware } from "../middlewares/tsMiddlewares"


// import config from "../db/tsKnex"
// import { db, quickUpdate } from "../db/databaseActions"

// import { error } from "console"
import { loginPostFunction, logoutPostFunction, registerPostFunction, verifyPostFunction } from "../helpers/routeFunctions"


const app = express()
app.use(express.json())
app.use(express.urlencoded({extended: false}))
app.use(session({
    secret: "ts_secret",
    resave: false,
    saveUninitialized: false
}))


// ROUTES

app.route("/register")
    .get(checkSession, (req, res) => 
        res.sendFile(path.join(__dirname, "../..", "public", "register.html")))
    .post(checkSession, async (req, res) => await registerPostFunction(req, res))


app.post("/verify", async (req, res) => await verifyPostFunction(req, res))


app.get("/login", loginTimeMiddleware, checkSession, (req, res) => 
    res.sendFile(path.join(__dirname, "../..", "public", "login.html")))
app.post("/login", loginTimeMiddleware, checkSession, async (req, res) => await loginPostFunction(req, res))


app.post("/logout", logoutMiddleware, (req, res) => logoutPostFunction(req, res))







app.listen(3000, () => {
    console.log("TYPE SCRIPT")
})