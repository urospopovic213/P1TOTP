const express = require("express")
const speakeasy = require("speakeasy")
const QRCode = require("qrcode")
const path = require("path")
const session = require("express-session")
const bcrypt = require("bcrypt")

const verifyToken = require("./verifyUser.js")
const { send } = require("process")

const users = [
    {
        username: 'lazar',
        password: '$2b$10$VWU2kQ2XYJYD7Q1IE.URlev8HdP5Dkmna0q5of6eA7hN9k6WaOwVC',
        secret: {
          ascii: 'a#VpkzQQI,h:PT{oTED0e)u?UEn[)92T',
          hex: '612356706b7a5151492c683a50547b6f544544306529753f55456e5b29393254',
          base32: 'MERVM4DLPJIVCSJMNA5FAVD3N5KEKRBQMUUXKP2VIVXFWKJZGJKA',
          otpauth_url: 'otpauth://totp/SecretKey?secret=MERVM4DLPJIVCSJMNA5FAVD3N5KEKRBQMUUXKP2VIVXFWKJZGJKA'
        },
        verified: true,
        loginAttempts: 0,
        bannedUntil: 0
    }
]


const app = express()

app.use(express.json())
app.use(express.urlencoded({extended: false}))
app.use(session({
    secret: "secret_session",
    resave: false,
    saveUninitialized: false
}))






// MIDDLEWARES

const loginTimeMiddleware = (req, res, next) => {
    let seconds = new Date().getSeconds()
    console.log(seconds)
    if (seconds >= 35 && seconds <= 45){
        next()
    }
    else {
        res.sendStatus(404)
    }
}
const checkSession = (req, res, next) => {
    if (req.session.username) {
        res.send("Korisnik je vec ulogovan")
    } else {
        next()
    }
}



// ROUTES

app.post("/verify", (req, res) => {
    const token = req.body.userToken
    const username = req.body.username

    let current_user_index = null
    users.forEach((u, index) => {
        if (u["username"] === username) {
            current_user_index = index
        }
    })

    if (current_user_index === null) {
        res.status(500).send("Nepostojeci usename")
    }
    else {
        const is_verified = verifyToken(users[current_user_index]["secret"].base32, token)
        if (is_verified) {
            users[current_user_index]["verified"] = true
            res.send("User verified")
        }else {
            res.send("Bad token")
        }
    }


})



app.route("/register")
    .get(checkSession, (req, res) => {
        res.sendFile(path.join(__dirname, "public", "register.html"))
    })
    .post(checkSession, async (req, res) => {
        
        try {
            console.log(req.body)
            const hashedPassword = await bcrypt.hash(req.body.password, 10)
    
            let new_user = {
                "username":req.body.username,
                "password": hashedPassword,
                "secret": speakeasy.generateSecret(),
                "verified": false,
                loginAttempts: 0,
                bannedUntil: 0

            }
            users.push(new_user)

            QRCode.toDataURL(new_user["secret"].otpauth_url, (err, data_url) => {
                res.send(
                    `<img src=${data_url}> <br> <p>Manually: ${new_user["secret"].base32}
                    <a href="/login">Done</a><br><br>
    
                    <form action="/verify" method="post">
                        <label for="token">Token:</label>
                        <input type="text" name="token">
    
                        <button>SUBMIT</button>
                    </form>`
                )
            })

        } catch {
            res.status(500).send()
        }   

    })




app.get("/login", loginTimeMiddleware, checkSession, (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"))

})
app.post("/login", loginTimeMiddleware, checkSession, async (req, res) => {
    const username = req.body.username
    const password = req.body.password
    const token = req.body.token


    let user = null
    users.forEach((u, index) => {
        if (u["username"] === username) {
            user = u 
        }
    })

    console.log(user)
    if (user === null) {
        res.status(400).send("User does not exist")
    } 
    else if (user["loginAttempts"] >= 3) {
        let current_time = new Date(Date.now())
        if (current_time >= user["bannedUntil"]) {
            user["loginAttempts"] = 0
        } else {
            res.send(`User is banned until: ${user["bannedUntil"]}`)
            return
        }
    }


    try {
        const is_password_correct = await bcrypt.compare(password, user.password)
        if (!is_password_correct){
            res.send("Wrong password")
        }
        else if (!user["verified"]) {
            res.send("User nije verifikovan. Idi na /verify da bi ga verifikovao")
        }
        else {
            if (verifyToken(user["secret"].base32, token)) {
                req.session.username = user["username"]
                console.log(req.session.username)
                res.send("User logged in")
            }   
            else {
                user["loginAttempts"] += 1
                if (user["loginAttempts"] >= 3) {
                    user["bannedUntil"] = Date.now() + 1 * 60 * 1000
                }
                res.status(500).send("Bad token")
            }
        }
    } catch {
        res.status(500).send()
    }


})


app.post("/logout", (req, res) => {
    if (req.session.username) {
        req.session.destroy((err) => {
            if (err) {
                res.send("Logout error")
            } else {
                res.send("Logout successful")
            }
        })
    }
    else {
        res.send("Prvo se uloguj na: /login")
    }


})






app.listen(3000, () => {
    console.log("Server2 is running on port 3000")
})