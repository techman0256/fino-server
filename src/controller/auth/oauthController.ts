import { Request, Response } from "express";
import {Google, generateState, generateCodeVerifier, decodeIdToken} from "arctic";
import { ArcticFetchError, OAuth2RequestError } from "arctic";
import dotenv from "dotenv";

import User from "../../models/User.js";
import {generateSessionToken} from './authController.js'

dotenv.config();

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;
const GOOGLE_REDIRECT_URI = "http://localhost:3000/google/callback";

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  throw new Error("Missing Google OAuth environment variables");
}
const google = new Google(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);
const OAUTH_EXCHANGE_EXPIRY = 60 * 10 * 1000;

interface IdTokenClaims {
  name: string;
  email: string;
  picture: string;
}

// cookie configuration for state and codeVerifier
const cookieConfig = {
  httpOnly: true,
  secure: true,
  maxAge: OAUTH_EXCHANGE_EXPIRY,
  path: "/",
}

// generate the Authorization URL for google authentication
// this will get you the redirect url to login with google page
const getGoogleLoginPage = (req: Request, res: Response) => {
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const scopes = ["openid", "profile","email"];
  const url = google.createAuthorizationURL(state, codeVerifier, scopes);
  
  res.cookie("google_oauth", state, cookieConfig);
  res.cookie("google_code_verifier", codeVerifier, cookieConfig);

  return url.toString();
}


// Once user authenticate from google, the callback will get you here
// Here we will verify the state and code given by user's requests with ours
const validateAuthorizationCode = async (req: Request, res: Response) => {
  const {code, state} = req.body;
  const stored_state = req.cookies.google_oauth;
  const google_code_verifier = req.cookies.google_code_verifier;  
  
  // If anything is not present throw 400 error to user
  if (!code || !state || !stored_state || !google_code_verifier || state !== stored_state) {
    return res.status(400).json({error: "Invalid login attempt"});
  }

  // If everythings is present
  try {
    // First validate authorization code and get the token from google
    const tokens = await google.validateAuthorizationCode(code, google_code_verifier);
    const accessToken = tokens.accessToken();
    const accessTokenExpiresAt = tokens.accessTokenExpiresAt();

    // Extract the necessary users info by claiming the token
    const claim = decodeIdToken(tokens.idToken()) as IdTokenClaims;
    const {name : username, email, picture : profilePicture} = claim;

    let user = await User.findOne({email : email});
    // Case 1 : User exist and provider is !null (means the oauth connected before)
    // Case 2 : User exist but has registered using email and password
    if (user && user.password) {
      user.provider = 'google';
      if (profilePicture) user.profilePicture = profilePicture;
    }
    // Case 3 : User don't exist
    if (!user) user = await User.create({username: username, email: email, profilePicture: profilePicture, provider: 'google'});
    const token = generateSessionToken(user);
    res.status(200).json({message: "Signed In Successfully ....." , userId: user.id});
  } catch (e) {
    if (e instanceof OAuth2RequestError) {
      // console.error("OAuth2 error:", e);
      return res.status(401).json({ error: "Invalid authorization code or credentials" });
    }

    if (e instanceof ArcticFetchError) {
      // console.error("Fetch error from Google:", e);
      return res.status(502).json({ error: "Google service unavailable" });
    }

    // console.error("Unexpected error:", e);
    return res.status(500).json({ error: "Internal server error", message: e });
  } 
}

export default {getGoogleLoginPage, validateAuthorizationCode};