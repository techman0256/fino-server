import mongoose, { Schema, Document, Types } from "mongoose";

export interface IAccount extends Document {
  userId: Types.ObjectId;
  name: string;
  accountNumber?: string;
  balance: number;
  type: 'Bank' | 'Wallet' | 'Cash';
  createdAt: Date;
}

const AccountSchema: Schema<IAccount> = new Schema<IAccount>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  accountNumber: {type: String, required: false},
  balance: { type: Number, default: 0 },
  type: { type: String, enum: ['Bank', 'Wallet', 'Cash'], required: true },
  createdAt: { type: Date, default: Date.now }
});

AccountSchema.index({userId: 1});
AccountSchema.index({accountNumber: 1});

export default mongoose.model<IAccount>('Account', AccountSchema);
