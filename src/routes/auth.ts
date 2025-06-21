import {Router, Request, Response} from 'express';
import oauth from "../controller/auth/oauth";

const authRoutes = Router();

authRoutes.get("/", (req: Request, res: Response) => {
    res.json({message : "This is the auth routes"})
})

authRoutes.get("/google", (req: Request, res: Response) => {
    oauth.printMethod();
    res.json({message : "This is the google auth routes"})
})

export default authRoutes;