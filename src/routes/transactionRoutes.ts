// routes/transactionRoutes.ts
import { Router, Response, Request } from "express";
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "../controller/transactionController.js";

const transactionRoutes = Router();

// US-TR-01 & US-TR-07: View all transactions with filters
transactionRoutes.get("/", getTransactions);

// US-TR-02: Add a new transaction
transactionRoutes.post("/", createTransaction);

// US-TR-03: Edit a transaction
transactionRoutes.put("/:id", (req: Request, res: Response) => {
  updateTransaction(req, res);
});

// US-TR-03: Delete a transaction
transactionRoutes.delete("/:id", (req: Request, res: Response) => {
  deleteTransaction(req, res);
});

// US-TR-04, US-TR-05, US-TR-06: Import CSV/XLS

export default transactionRoutes;
