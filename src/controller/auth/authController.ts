import {Request, Response} from 'express';
import JWT from "jsonwebtoken";
import bcrypt from 'bcrypt'
import User, { IUser } from "../../models/User";

const SESSION_TOKEN_DURATION = 60 * 60; // Currently expires in 1 hour

// cookie configuration for JWT Token
const tokenConfig = {
  httpOnly: true,
  secure: true,
  maxAge: SESSION_TOKEN_DURATION,
  path: "/",
}

interface SessionPayload {
    userId: string, 
    username: string, 
    iat?: number;
    exp?: number;
}

const SignUp = async (req: Request, res: Response) => {
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
        const userObj = user.toObject();
        delete userObj.password;
        const token = generateSessionToken(user);
        res.cookie('JWT', token, tokenConfig);
        res.status(200).json({message: "Signed Up Successfully ....." , user : userObj});


    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

const SignIn = async (req: Request, res: Response) => {
    try {
        console.log("this is request " ,req);
        
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
        const userObj = user.toObject();
        delete userObj.password;
        res.cookie('JWT', token, tokenConfig);
        res.status(200).json({message: "Signed In Successfully ....." , user: userObj});

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

export const validateSessionToken = async(token : string)  => {
    try {
        const decoded = JWT.verify(token, `Don't tell the secret`) as SessionPayload;
        const {userId} = decoded;
        const user = User.findOne({ userId }).select('-password');
        if (!user) return { message: 'User not found', validated: false };

        return {messaage: "Successfully validated", user: user, validated: true};
    } catch (error: any) {
        return {message: error.name || "Token validation failed", validated: false}
    }
}

export default {SignIn, SignUp};