import express, { Application, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import accountRoutes from "./routes/accountRoutes";
import transactionRoutes from "./routes/transactionRoutes"
import indexRoutes from "./routes/index";
import authRoutes from "./routes/authRoutes";
dotenv.config();

const app: Application = express();

// Middleware
app.use(cors({
    origin: 'http://localhost:3000', // Your frontend URL
    credentials: true // Important for cookies
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser()); // Enable cookie parsing

app.use('/api/', indexRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/auth', authRoutes);
app.get("/", (req: Request, res: Response) => {
    res.json({message: "Hello, Fino Backend server is Running."})
});



export default app;