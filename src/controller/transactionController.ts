import { Request, Response } from "express";
import Transaction from "../models/Transaction";

// GET /transactions → Get all transactions
export const getTransactions = async (req: Request, res: Response) => {
  try {
    const page = parseInt(typeof req.query.page === "string" ? req.query.page : "1", 10);
    const pageSize = 20;
    const skip = (page - 1) * pageSize;

    const cond: any = { userId: req.query.userId };

    // Type filter (income/expense/transfer)
    if (req.query.type) cond.type = req.query.type;

    // Category filter
    if (req.query.category) cond.category = req.query.category;

    // Account filter
    if (req.query.account) cond.account = req.query.account;

    // Status filter
    if (req.query.status) cond.status = req.query.status;

    // Amount Range Filter
    if (req.query.minAmount) {
      cond.amount = { ...cond.amount, $gte: Number(req.query.minAmount) };
    }
    if (req.query.maxAmount) {
      cond.amount = { ...cond.amount, $lte: Number(req.query.maxAmount) };
    }

    // Date Range Filter
    if (req.query.startDate || req.query.endDate) {
      cond.date = {};
      if (req.query.startDate) cond.date.$gte = new Date(req.query.startDate as string);
      if (req.query.endDate) cond.date.$lte = new Date(req.query.endDate as string);
    }

    // Description Search
    if (req.query.searchTerm) {
      cond.description = { $regex: req.query.searchTerm, $options: "i" };
    }

    const total = await Transaction.countDocuments(cond);
    const totalPages = Math.ceil(total / pageSize);

    const transactions = await Transaction.find(cond).skip(skip).limit(pageSize).sort({ date: -1 });

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
  try {
    const transaction = new Transaction(req.body);
    const saved = await transaction.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: "Failed to create transaction", error: err });
  }
};

// PUT /transactions/:id → Update a transaction
export const updateTransaction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await Transaction.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    res.status(200).json(updated);
  } catch (err) {
    res.status(400).json({ message: "Failed to update transaction", error: err });
  }
};

// DELETE /transactions/:id → Delete a transaction
export const deleteTransaction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await Transaction.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    res.status(200).json({ message: "Transaction deleted", id });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete transaction", error: err });
  }
};
