import {Request, Response} from 'express';
import JWT from "jsonwebtoken";
import bcrypt from 'bcrypt'
import User, { IUser } from "../../models/User.js";

const SESSION_TOKEN_DURATION = 60 * 60; // Currently expires in 1 hour
interface SessionPayload {
    userId: string, 
    username: string, 
    iat?: number;
    exp?: number;
}

const SignUp = async (req: Request, res: Response) => {

    console.log("Signing up ..............................>>");
    
    try {
        const {username, email, password} = req.body;
        let user = await User.findOne({email});
        if (user) {
            return res.status(409).json({ message: "User already exists with this email." });
        }
        
        // Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        // create the user and generate session token
        user = await User.create({username: username, email: email, password: hashedPassword});
        const token = generateSessionToken(user);
        res.status(200).json({message: "Signed Up Successfully ....." , sessionToken: token});


    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

const SignIn = async (req: Request, res: Response) => {
    console.log("running sign in method >>>>>");
    
    try {
        const {email, password} = req.body;
        // 1. chech if user exists
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(401).json({ message: "Invalid email." });
        }
        // 2. verify is password is correct
    
        const isPasswordCorrect = await bcrypt.compare(password, user.password!);
        if (!isPasswordCorrect) {
            return res.status(401).json({ message: "Invalid password." });
        }

        const token = generateSessionToken(user);
        res.status(200).json({message: "Signed In Successfully ....." , sessionToken: token});

    } catch (error) {
        console.error("Signin error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}


// Once user is authorized through any method, generate this session JWT token 
export const generateSessionToken = (user: IUser): string => {
  const payload = { 
    userId: user.id, username: user.username
}
  const token: string = JWT.sign(payload, `Don't tell the secret`, {expiresIn: SESSION_TOKEN_DURATION});

  return token;
}

export const validateSessionToken = (token : string): SessionPayload | {message: string} => {
    try {
        const decoded = JWT.verify(token, `Don't tell the secret`) as SessionPayload;
        console.log(decoded);
        return decoded
    } catch (error: any) {
        return {message: error.name || "Token validation failed"}
    }
}

export default {SignIn, SignUp};