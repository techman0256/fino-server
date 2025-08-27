import mongoose, { Schema, Document } from "mongoose";

export type AuthProvider = "google" | "other" | null;
export interface IUser extends Document {
    username: string;
    email: string;
    password?: string;
    profilePicture?: string;
    provider : AuthProvider;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema: Schema = new Schema({
    username: { type: String, required: true, trim: true, index: true },
    email:    { type: String, required: true, unique: true, trim: true, index: true },
    password: { type: String, required: function (this: IUser) {
        return this.provider === null;
    } },
    profilePicture: { type: String },
    provider: { type: String, enum : ["google", "other"], default: null},
}, { timestamps: true });

export default mongoose.model<IUser>("User", UserSchema);