import express from "express"

import path from "path"
import session from "express-session"

import { loginTimeMiddleware, checkSession, logoutMiddleware } from "../middlewares/tsMiddlewares"

import { loginPostFunction, logoutPostFunction, registerPostFunction, verifyPostFunction } from "../helpers/routeFunctions"

import swaggerUi from "swagger-ui-express"
import YAML from "yamljs"
const swaggerDocument = YAML.load(path.join(__dirname, "../../swagger.yaml"))



const app = express()
app.use(express.json())
app.use(express.urlencoded({extended: false}))
app.use(session({
    secret: "ts_secret",
    resave: false,
    saveUninitialized: false
}))


app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument))


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