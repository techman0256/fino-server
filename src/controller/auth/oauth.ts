// import {Google, generateState, generateCodeVerifier} from "arctic";

// const arctic = require('arctic')
import dotenv from "dotenv";

dotenv.config();
console.log(process.env.GOOGLE_CLIENT_ID);

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  throw new Error("Missing Google OAuth environment variables");
}

const GOOGLE_REDIRECT_URI = "http://localhost:3000/google/callback";

const google = "google";
// const google = new Google(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);

// const getGoogleLoginPage = async (req: Request, res: Response) => {
//     const state = generateState();
//     const codeVerifier = generateCodeVerifier();
//     const scopes = ["openid", "profile","email"];
//     const url = google.createAuthorizationURL(state, codeVerifier, scopes);
//     console.log(url);
    
//     return url;
// }

const printMethod = () => {
    console.log(process.env.GOOGLE_CLIENT_ID);
}

export default {google, printMethod};