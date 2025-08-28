import {Router, Request, Response} from 'express';
import oauth from "../controller/auth/oauthController";
import auth from "../controller/auth/authController"
const authRoutes = Router();

authRoutes.get("/", (req: Request, res: Response) => {
    res.json({message : "This is the auth routes"})
})

authRoutes.post('/signup', async (req: Request, res: Response) => {
    auth.SignUp(req, res);
});
authRoutes.post('/signin', async (req: Request, res: Response) => {
    auth.SignIn(req, res);
});


// once the authorization is done, flow will redirect to callback route
authRoutes.post('/google/callback', (req: Request, res: Response) => {   
    oauth.validateAuthorizationCode(req, res);
})

// this route will send you the redirect authorization URL
authRoutes.get("/google", (req: Request, res: Response) => {    
    const url:String = oauth.getGoogleLoginPage(req, res);    
    res.json({authorizationURL : url, message: "Please redirect to this URL"})
})

export default authRoutes;