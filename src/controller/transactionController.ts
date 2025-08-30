import { Request, Response } from "express";
import mongoose from "mongoose";
import Transaction from "../models/Transaction.js";
import Account from "../models/Account.js";

// Helper: apply balance changes
const applyBalanceChange = async (tx: any, reverse = false, session?: mongoose.ClientSession) => {
  if (tx.type === "income" || tx.type === "expense") {
    const sign = tx.type === "income" ? 1 : -1;
    const delta = reverse ? -sign * tx.amount : sign * tx.amount;
    await Account.findByIdAndUpdate(
      tx.account,
      { $inc: { balance: delta } },
      { session }
    );
  } else if (tx.type === "transfer") {
    const fromDelta = reverse ? tx.amount : -tx.amount;
    const toDelta = reverse ? -tx.amount : tx.amount;

    // Use 'account' as fromAccount
    await Account.findByIdAndUpdate(tx.account, { $inc: { balance: fromDelta } });
    if (tx.toAccount) {
      await Account.findByIdAndUpdate(tx.toAccount, { $inc: { balance: toDelta } });
    }
  }
};

// GET /transactions → Get all transactions
export const getTransactions = async (req: Request, res: Response) => {
  try {
    const page = parseInt(typeof req.query.page === "string" ? req.query.page : "1", 10);
    const pageSize = 20;
    const skip = (page - 1) * pageSize;

    const cond: any = { userId: req.query.userId };

    if (req.query.type) cond.type = req.query.type;
    if (req.query.category) cond.category = req.query.category;
    if (req.query.account) cond.account = req.query.account;
    if (req.query.status) cond.status = req.query.status;

    if (req.query.minAmount) {
      cond.amount = { ...cond.amount, $gte: Number(req.query.minAmount) };
    }
    if (req.query.maxAmount) {
      cond.amount = { ...cond.amount, $lte: Number(req.query.maxAmount) };
    }

    if (req.query.startDate || req.query.endDate) {
      cond.date = {};
      if (req.query.startDate) cond.date.$gte = new Date(req.query.startDate as string);
      if (req.query.endDate) cond.date.$lte = new Date(req.query.endDate as string);
    }

    if (req.query.searchTerm) {
      cond.description = { $regex: req.query.searchTerm, $options: "i" };
    }

    const total = await Transaction.countDocuments(cond);
    const totalPages = Math.ceil(total / pageSize);

    const transactions = await Transaction.find(cond)
      .skip(skip)
      .limit(pageSize)
      .sort({ date: -1 });

    res.status(200).json({
      page,
      total,
      totalPages,
      data: transactions,
    });
  } catch (error) {
    res.status(500).json({ error: "Server Error", details: error });
  }
};

// POST /transactions → Create a new transaction
export const createTransaction = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { type, account, toAccount } = req.body;

    // Validate required accounts
    const fromAcc = await Account.findById(account).session(session);
    if (!fromAcc) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Invalid account" });
    }

    if (type === "transfer") {
      if (!toAccount) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: "Transfer requires toAccount" });
      }
      const destAcc = await Account.findById(toAccount).session(session);
      if (!destAcc) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: "Invalid toAccount" });
      }
    }

    const transaction = new Transaction(req.body);
    const saved = await transaction.save({ session });

    await applyBalanceChange(saved, false, session);

    await session.commitTransaction();
    session.endSession();

    res.status(201).json(saved);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ message: "Failed to create transaction", error: err });
  }
};

// PUT /transactions/:id → Update a transaction
export const updateTransaction = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const oldTx = await Transaction.findById(id).session(session);
    if (!oldTx) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Transaction not found" });
    }

    const { type, account, toAccount } = req.body;

    // Validate required accounts if changing them
    if (account && account.toString() !== oldTx.account.toString()) {
      const fromAcc = await Account.findById(account).session(session);
      if (!fromAcc) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: "Invalid account" });
      }
    }

    if (type === "transfer" || toAccount) {
      if (!toAccount && oldTx.type === "transfer") {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: "Transfer requires toAccount" });
      }
      if (toAccount) {
        const destAcc = await Account.findById(toAccount).session(session);
        if (!destAcc) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({ message: "Invalid toAccount" });
        }
      }
    }

    // rollback old balance
    await applyBalanceChange(oldTx, true, session);

    const updated = await Transaction.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
      session,
    });

    if (!updated) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Transaction not found after update" });
    }

    // apply new balance
    await applyBalanceChange(updated, false, session);

    await session.commitTransaction();
    session.endSession();

    res.status(200).json(updated);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ message: "Failed to update transaction", error: err });
  }
};

// DELETE /transactions/:id → Delete a transaction
export const deleteTransaction = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const deleted = await Transaction.findByIdAndDelete(id, { session });
    if (!deleted) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Transaction not found" });
    }

    // rollback deleted transaction
    await applyBalanceChange(deleted, true, session);

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ message: "Transaction deleted", id });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: "Failed to delete transaction", error: err });
  }
};
