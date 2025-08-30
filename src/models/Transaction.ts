// models/transaction.model.ts
import mongoose, { Schema, Document } from "mongoose";
import { ref } from "process";

export interface ITransaction extends Document {
  date: Date;
  description?: string;
  amount: number;
  type: "income" | "expense" | "transfer";
  category: mongoose.Types.ObjectId;
  account: mongoose.Types.ObjectId;
  toAccount: mongoose.Types.ObjectId;
  status?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    date: { type: Date, required: true, },
    description: { type: String, },
    amount: { type: Number, required: true, },
    type: { type: String, enum: ["income", "expense", "transfer"], required: true },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    account: { type: Schema.Types.ObjectId, ref: "Account",required: true },
    toAccount: { type: Schema.Types.ObjectId, ref: "Account", required: false},
    status: { type: String, default: "cleared" },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ITransaction>("Transaction", transactionSchema);
