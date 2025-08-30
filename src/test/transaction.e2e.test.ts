/**
 * Test Coverage for Transaction APIs
 *
 * ✅ US-TR-01: Get transactions (with pagination + filters basic check)
 * ✅ US-TR-02: Create transaction (income/expense)
 * ✅ US-TR-03: Update transaction
 * ✅ US-TR-04: Delete transaction
 * ✅ Balance updates:
 *    - Income adds to account balance
 *    - Expense subtracts from account balance
 *    - Update rolls back old amount and applies new one
 *    - Delete rolls back transaction effect
 * ✅ Transfer transactions:
 *    - Deducts from `fromAccount`
 *    - Adds to `toAccount`
 *
 * TODO (Future):
 * - Validation errors (missing fields, invalid type, negative amount, etc.)
 * - Advanced filters (minAmount, maxAmount, date range, searchTerm)
 * - Pagination edge cases
 */

import request from "supertest";
import mongoose from "mongoose";
import app from "../app.js";
import connectDB from "../db.js";
import Account from "../models/Account.js";
import Transaction from "../models/Transaction.js";

let account: any;
let account2: any;

beforeAll(async () => {
  await connectDB();
  await mongoose.connection.db!.dropDatabase();

  // Primary wallet account
  account = await Account.create({
    userId: new mongoose.Types.ObjectId(),
    name: "Main Wallet",
    type: "Wallet",
    balance: 0,
  });

  // Backup bank account
  account2 = await Account.create({
    userId: account.userId,
    name: "Backup Bank",
    type: "Bank",
    balance: 1000,
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("Transaction API", () => {
  let createdTxId: string;

  it("should create an income transaction and increase account balance", async () => {
    const res = await request(app)
      .post("/api/transactions")
      .send({
        date: new Date(),
        description: "Salary",
        amount: 1000,
        type: "income",
        category: new mongoose.Types.ObjectId(),
        account: account._id,
      });

    expect(res.status).toBe(201);
    createdTxId = res.body._id;

    const updatedAcc = await Account.findById(account._id);
    // Balance starts 0 → +1000 income
    expect(updatedAcc?.balance).toBe(1000);
  });

  it("should create an expense transaction and decrease account balance", async () => {
    const res = await request(app)
      .post("/api/transactions")
      .send({
        date: new Date(),
        description: "Groceries",
        amount: 200,
        type: "expense",
        category: new mongoose.Types.ObjectId(),
        account: account._id,
      });

    expect(res.status).toBe(201);

    const updatedAcc = await Account.findById(account._id);
    // Balance was 1000 → -200 expense
    expect(updatedAcc?.balance).toBe(800);
  });

  it("should update a transaction and adjust balance correctly", async () => {
    const res = await request(app)
      .put(`/api/transactions/${createdTxId}`)
      .send({
        amount: 1000, // was already 1000 → update should not change balance
        description: "Updated salary",
      });

    expect(res.status).toBe(200);

    const updatedAcc = await Account.findById(account._id);
    // No net change, still 800
    expect(updatedAcc?.balance).toBe(800);
  });

  it("should delete a transaction and rollback balance", async () => {
    const res = await request(app).delete(`/api/transactions/${createdTxId}`);
    expect(res.status).toBe(200);

    const updatedAcc = await Account.findById(account._id);
    // Removing the original +1000 income → 800 - 1000 = -200
    expect(updatedAcc?.balance).toBe(-200);
  });

  it("should create a transfer transaction and update both accounts", async () => {
    const res = await request(app)
      .post("/api/transactions")
      .send({
        date: new Date(),
        description: "Transfer to wallet",
        amount: 500,
        type: "transfer",
        category: new mongoose.Types.ObjectId(),
        account: account2._id, // from account
        toAccount: account._id, // to account
      });

    expect(res.status).toBe(201);

    const fromAcc = await Account.findById(account2._id);
    const toAcc = await Account.findById(account._id);

    // From: 1000 → -500 = 500
    expect(fromAcc?.balance).toBe(500);
    // To: -200 → +500 = 300
    expect(toAcc?.balance).toBe(300);
  });

  it("should fetch all transactions", async () => {
    const res = await request(app).get(`/api/transactions?userId=${account.userId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(Array.isArray(res.body.data)).toBe(true);
  });

//   it("should fail to create a transaction with negative amount", async () => {
//     const res = await request(app)
//       .post("/api/transactions")
//       .send({
//         date: new Date(),
//         description: "Negative amount test",
//         amount: -500,
//         type: "income",
//         category: new mongoose.Types.ObjectId(),
//         account: account._id,
//       });

//     expect(res.status).toBe(400);
//     expect(res.body).toHaveProperty("message");
//   });

  it("should fail to create a transaction with invalid account", async () => {
    const res = await request(app)
      .post("/api/transactions")
      .send({
        date: new Date(),
        description: "Invalid account test",
        amount: 100,
        type: "expense",
        category: new mongoose.Types.ObjectId(),
        account: new mongoose.Types.ObjectId(), // does not exist
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("message");
  });

  it("should fail to create a transaction with invalid type", async () => {
    const res = await request(app)
      .post("/api/transactions")
      .send({
        date: new Date(),
        description: "Invalid type test",
        amount: 100,
        type: "gift", // not in ["income","expense","transfer"]
        category: new mongoose.Types.ObjectId(),
        account: account._id,
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("message");
  });

  it("should fail to create a transfer without toAccount", async () => {
    const res = await request(app)
      .post("/api/transactions")
      .send({
        date: new Date(),
        description: "Transfer without toAccount",
        amount: 100,
        type: "transfer",
        category: new mongoose.Types.ObjectId(),
        account: account._id,
        // missing toAccount
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("message");
  });
});
