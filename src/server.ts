import express, { Application } from "express";
import cors from "cors";
import dotenv from "dotenv";
// import indexRoutes from "./routes/index"
import indexRoutes from "./routes/index";
import authRoutes from "./routes/auth";
import connectDB from "./db";
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/', indexRoutes);
app.use('/auth', authRoutes);

connectDB();

app.listen(PORT, () => {
    console.log(
        `Fino server running at port ${PORT}`
    );
    
})

