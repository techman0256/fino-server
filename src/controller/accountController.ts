import Account from '../models/Account';
import { Request, Response } from "express";

export const getAccounts = async (req: Request, res: Response) => {
  try {
    let page = parseInt(
      typeof req.query.page === 'string' ? req.query.page : '1',
      10
    );

    if (isNaN(page) || page < 1) page = 1; // ✅ clamp page to min=1

    const pageSize = 20;
    const skip = (page - 1) * pageSize;

    const cond: any = {};
    if (req.query.userId) cond.userId = req.query.userId; // ✅ don’t set undefined
    if (req.query.type) cond.type = req.query.type;
    if (req.query.searchTerm)
      cond.name = { $regex: req.query.searchTerm, $options: 'i' }; // fuzzy match
    if (req.query.minBalance) {
      cond.balance = { ...cond.balance, $gte: Number(req.query.minBalance) };
    }
    if (req.query.maxBalance) {
      cond.balance = { ...cond.balance, $lte: Number(req.query.maxBalance) };
    }

    const total = await Account.countDocuments(cond);
    const totalPages = Math.ceil(total / pageSize);

    const accounts = await Account.find(cond).skip(skip).limit(pageSize);

    res.status(200).json({
      page,                // ✅ always return normalized page
      pageSize,            // ✅ helpful for clients
      total,
      totalPages,
      data: accounts
    });
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
};

export const createAccount = async (req: Request, res: Response) => {
  try {
    const { name, balance, type } = req.body;

    // ✅ guard against missing userId in query
    if (!req.query.userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    const newAccount = new Account({
      userId: req.query.userId,
      name,
      balance,
      type,
    });

    await newAccount.save(); // ✅ will trigger schema validations (min balance, enum)
    res
      .status(201)
      .json({ data: newAccount, message: "Account created successfully." });
  } catch (error) {
    res.status(400).json({ error: 'Invalid Data' });
  }
};

export const updateAccount = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const updated = await Account.findOneAndUpdate(
      { _id: id },
      req.body,
      {
        new: true,
        runValidators: true,   // ✅ enforce schema validation on update
      }
    );

    if (!updated) return res.status(404).json({ error: 'Account not found' });

    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: 'Update failed' });
  }
};

export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await Account.findOneAndDelete({ _id: id });

    if (!deleted) return res.status(404).json({ error: 'Account not found' });

    res.json({ message: 'Account deleted' });
  } catch (error) {
    res.status(400).json({ error: 'Delete failed' });
  }
};