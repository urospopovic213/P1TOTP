import { Request, Response, NextFunction } from "express"


export const loginTimeMiddleware = (req: Request, res: Response, next: NextFunction) => {
    let seconds = new Date().getSeconds()
    console.log(seconds)
    if (seconds >= 35 && seconds <= 45){
        next()
    }
    else {
        res.sendStatus(404)
    }
    // next()
}
export const checkSession = (req: Request, res: Response, next: NextFunction) => {
    if ((req.session as any).username) {
        res.send("Korisnik je vec ulogovan")
    } else {
        next()
    }
}


export const logoutMiddleware = (req: Request, res: Response, next: NextFunction) => {
    if (!(req.session as any).username) {
        res.send("Korisnik nije ulogovan")
    } else {
        next()

    }
}