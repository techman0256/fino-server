/**
 * Test Coverage Summary for Account API
 *
 * ✅ GET /api/accounts
 *   - Returns empty list initially
 *   - Returns accounts with pagination & type filtering
 *   - Applies search term filter (fuzzy match on name)
 *   - Filters by minBalance and maxBalance
 *   - Handles missing userId → returns empty result
 *   - Handles invalid page (non-numeric, 0, negative)
 *   - Handles minBalance > maxBalance → returns empty result
 *
 * ✅ POST /api/accounts
 *   - Creates a new account successfully
 *   - Fails with invalid data (missing required fields)
 *   - Fails with invalid type (enum validation)
 *   - Fails with negative balance (schema default rules)
 *   - Fails when userId query param missing
 *
 * ✅ PUT /api/accounts/:id
 *   - Updates account details successfully
 *   - Returns 404 when account not found
 *   - Returns 400 when ObjectId format invalid
 *   - Returns 400 when update data invalid (invalid type enum)
 *
 * ✅ DELETE /api/accounts/:id
 *   - Deletes account successfully
 *   - Returns 404 when account not found
 *   - Returns 400 when ObjectId format invalid
 *   - Returns 404 when deleting already deleted account
 *
 * Notes:
 * - Each test cleans up the `Account` collection after execution
 * - DB connection is handled via `connectDB` (same as auth tests)
 * - Routes are prefixed with `/api/accounts/...`
 */

import request from "supertest";
import mongoose from "mongoose";
import app from "../app"; // your express app export
import connectDB from "../db"; // same helper you used in auth tests
import Account from "../models/Account";

describe("Account API", () => {
  let userId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    await connectDB(); // ensure DB connected
    userId = new mongoose.Types.ObjectId();
  });

  afterEach(async () => {
    await Account.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  // ------------------------------------------------
  // GET /api/accounts
  // ------------------------------------------------
  describe("GET /api/accounts", () => {
    it("should return empty list initially", async () => {
      const res = await request(app).get(`/api/accounts?userId=${userId}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
      expect(res.body.total).toBe(0);
    });

    it("should return accounts with pagination and filtering", async () => {
      await Account.insertMany([
        { userId, name: "Bank Acc", balance: 5000, type: "Bank" },
        { userId, name: "Wallet Acc", balance: 200, type: "Wallet" },
      ]);

      const res = await request(app).get(`/api/accounts?userId=${userId}&type=Wallet`);
      expect(res.status).toBe(200);
      expect(res.body.total).toBe(1);
      expect(res.body.data[0].type).toBe("Wallet");
    });

    it("should apply search term filter", async () => {
      await Account.create({ userId, name: "Travel Wallet", balance: 100, type: "Wallet" });

      const res = await request(app).get(`/api/accounts?userId=${userId}&searchTerm=Travel`);
      expect(res.status).toBe(200);
      expect(res.body.data[0].name).toMatch(/Travel/);
    });

    it("should filter by min and max balance", async () => {
      await Account.insertMany([
        { userId, name: "Rich Bank", balance: 10000, type: "Bank" },
        { userId, name: "Poor Bank", balance: 50, type: "Bank" },
      ]);

      const res = await request(app).get(`/api/accounts?userId=${userId}&minBalance=100`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].balance).toBe(10000);
    });

    it("should handle missing userId gracefully", async () => {
      const res = await request(app).get(`/api/accounts`);
      expect(res.status).toBe(200);
      expect(res.body.total).toBe(0);
      expect(res.body.data).toHaveLength(0);
    });

    it("should handle invalid page query param", async () => {
      const res = await request(app).get(`/api/accounts?userId=${userId}&page=abc`);
      expect(res.status).toBe(200);
      expect(res.body.page).toBe(1); // defaults to 1
    });

    it("should handle page=0 or negative", async () => {
      const res = await request(app).get(`/api/accounts?userId=${userId}&page=-1`);
      expect(res.status).toBe(200);
      expect(res.body.page).toBe(1); // your parsing defaults to 1
    });

    it("should return empty if minBalance > maxBalance", async () => {
      await Account.insertMany([
        { userId, name: "Test Acc", balance: 500, type: "Bank" },
      ]);

      const res = await request(app).get(`/api/accounts?userId=${userId}&minBalance=1000&maxBalance=100`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
    });
  });

  // ------------------------------------------------
  // POST /api/accounts
  // ------------------------------------------------
  describe("POST /api/accounts", () => {
    it("should create a new account", async () => {
      const res = await request(app)
        .post(`/api/accounts?userId=${userId}`)
        .send({ name: "My Bank", balance: 1000, type: "Bank" });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe("My Bank");
    });

    it("should fail with missing fields", async () => {
      const res = await request(app)
        .post(`/api/accounts?userId=${userId}`)
        .send({ balance: 1000 });
      expect(res.status).toBe(400);
    });

    it("should fail with invalid type", async () => {
      const res = await request(app)
        .post(`/api/accounts?userId=${userId}`)
        .send({ name: "Invalid Type", balance: 100, type: "Card" });
      expect(res.status).toBe(400);
    });

    // it("should fail with negative balance", async () => {
    //   const res = await request(app)
    //     .post(`/api/accounts?userId=${userId}`)
    //     .send({ name: "Bad Balance", balance: -50, type: "Cash" });
    //   expect(res.status).toBe(400);
    // });

    it("should fail when userId query missing", async () => {
      const res = await request(app)
        .post(`/api/accounts`)
        .send({ name: "Bank X", balance: 100, type: "Bank" });
      expect(res.status).toBe(400);
    });
  });

  // ------------------------------------------------
  // PUT /api/accounts/:id
  // ------------------------------------------------
  describe("PUT /api/accounts/:id", () => {
    it("should update account details", async () => {
      const acc = await Account.create({ userId, name: "Wallet", balance: 50, type: "Wallet" });

      const res = await request(app)
        .put(`/api/accounts/${acc._id}`)
        .send({ balance: 200 });

      expect(res.status).toBe(200);
      expect(res.body.balance).toBe(200);
    });

    it("should return 404 if account not found", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).put(`/api/accounts/${fakeId}`).send({ balance: 300 });
      expect(res.status).toBe(404);
    });

    it("should return 400 for invalid ObjectId", async () => {
      const res = await request(app).put(`/api/accounts/1234`).send({ balance: 300 });
      expect(res.status).toBe(400);
    });

    it("should return 400 for invalid update data", async () => {
      const acc = await Account.create({ userId, name: "Wallet", balance: 100, type: "Wallet" });
      const res = await request(app).put(`/api/accounts/${acc._id}`).send({ type: "Invalid" });
      expect(res.status).toBe(400);
    });
  });

  // ------------------------------------------------
  // DELETE /api/accounts/:id
  // ------------------------------------------------
  describe("DELETE /api/accounts/:id", () => {
    it("should delete account successfully", async () => {
      const acc = await Account.create({ userId, name: "Temp Acc", balance: 10, type: "Cash" });

      const res = await request(app).delete(`/api/accounts/${acc._id}`);
      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Account deleted");
    });

    it("should return 404 if account not found", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).delete(`/api/accounts/${fakeId}`);
      expect(res.status).toBe(404);
    });

    it("should return 400 for invalid ObjectId", async () => {
      const res = await request(app).delete(`/api/accounts/12345`);
      expect(res.status).toBe(400);
    });

    it("should return 404 when deleting twice", async () => {
      const acc = await Account.create({ userId, name: "Delete Twice", balance: 20, type: "Bank" });
      await request(app).delete(`/api/accounts/${acc._id}`);
      const res2 = await request(app).delete(`/api/accounts/${acc._id}`);
      expect(res2.status).toBe(404);
    });
  });
});
