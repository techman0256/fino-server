import mongoose, { Schema, Document, Types } from "mongoose";

export interface IOAuthAccount extends Document {
    user?: Types.ObjectId;
    provider: string;
    provider_account_id: string;
    profile?: any;
    createdAt: Date;
    updatedAt: Date;
}

const OAuthAccountSchema: Schema = new Schema({
    user:       { type: Schema.Types.ObjectId, ref: 'User', required: false },
    provider:   { type: String, required: true },
    provider_account_id: { type: String, required: true },
    profile:    { type: Schema.Types.Mixed },
}, { timestamps: true });

export default mongoose.model<IOAuthAccount>("OAuthAccount", OAuthAccountSchema); 