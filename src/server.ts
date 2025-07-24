import express, { Application, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
// import indexRoutes from "./routes/index"
import indexRoutes from "./routes/index.js";
import authRoutes from "./routes/authRoutes.js";
import connectDB from "./db.js";
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: 'http://localhost:3000', // Your frontend URL
    credentials: true // Important for cookies
}));
app.use(express.json());
app.use(cookieParser()); // Enable cookie parsing

app.use('/api/', indexRoutes);
app.use('/auth', authRoutes);
app.get("/", (req: Request, res: Response) => {
    res.json({message: "Hello, Fino Backend server is Running."})
});
connectDB();

app.listen(PORT, () => {
    console.log(
        `Fino server running at port ${PORT}`
    );
    
})

