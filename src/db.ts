import mongoose from "mongoose";
import dotenv from "dotenv"
dotenv.config();
const MONGO_URI = `mongodb+srv://${process.env.TEST_DB_USERNAME}:${process.env.TEST_DB_PASSWORD}@cluster0.ps3rtcy.mongodb.net/`
console.log(MONGO_URI);

const connectDB = async () => {
    try {
        const con = await mongoose.connect(MONGO_URI);
        console.log(`✅ MongoDB connected: ${con.connection.host}`);
    } catch (err) {
        console.error(`MongoDB connection erro`, err);
    }
}

export default connectDB;
