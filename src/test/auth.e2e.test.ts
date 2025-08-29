
import request from "supertest";
import mongoose from "mongoose";
import app from "../app";
import User from "../models/User";
import connectDB from "../db";

/**
 * Auth E2E Test Suite
 *
 * This test suite covers the following cases for /auth routes:
 *
 * 1. ✅ Signup: create a new user successfully
 * 2. ✅ Signup: fail if email already exists (duplicate signup)
 * 3. ✅ Signup: fail with missing fields in request body
 * 4. ✅ Signin: login successfully with valid credentials
 * 5. ✅ Signin: fail with invalid email
 * 6. ✅ Signin: fail with invalid password
 *
 * Extra checks:
 * - Ensures response includes `set-cookie` header
 * - Verifies password is stored as a hashed value in the DB
 * - Cleans DB between tests
 */

beforeAll(async () => {
  await connectDB(); // make sure it’s awaited
});

afterEach(async () => {
  await User.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("Auth E2E", () => {
  it("POST /auth/signup → should create a new user", async () => {
    const res = await request(app)
      .post("/auth/signup")
      .send({ username: "pranav", email: "test@example.com", password: "123456" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message", "Signed Up Successfully .....");
    expect(res.body.user).toHaveProperty("username", "pranav");
    expect(res.headers["set-cookie"]).toBeDefined();

    // Verify DB entry
    const userInDb = await User.findOne({ email: "test@example.com" });
    expect(userInDb).not.toBeNull();
    expect(userInDb?.password).not.toBe("123456"); // password should be hashed
  });

  it("POST /auth/signup → should fail if email already exists", async () => {
    await request(app)
      .post("/auth/signup")
      .send({ username: "pranav", email: "test@example.com", password: "123456" });

    const res = await request(app)
      .post("/auth/signup")
      .send({ username: "other", email: "test@example.com", password: "abcdef" });

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty("message", "User already exists with this email.");
  });

  it("POST /auth/signin → should login an existing user", async () => {
    await request(app)
      .post("/auth/signup")
      .send({ username: "pranav", email: "test@example.com", password: "123456" });

    const res = await request(app)
      .post("/auth/signin")
      .send({ email: "test@example.com", password: "123456" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message", "Signed In Successfully .....");
    expect(res.body.user).toHaveProperty("username", "pranav");
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("POST /auth/signin → should fail with wrong email", async () => {
    const res = await request(app)
      .post("/auth/signin")
      .send({ email: "wrong@example.com", password: "123456" });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("message", "Invalid email.");
  });

  it("POST /auth/signin → should fail with wrong password", async () => {
    await request(app)
      .post("/auth/signup")
      .send({ username: "pranav", email: "test@example.com", password: "123456" });

    const res = await request(app)
      .post("/auth/signin")
      .send({ email: "test@example.com", password: "wrongpass" });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("message", "Invalid password.");
  });

  it("POST /auth/signup → should fail with missing fields", async () => {
    const res = await request(app)
      .post("/auth/signup")
      .send({ username: "pranav" }); // no email/password

    expect(res.status).toBe(500); // Your controller returns 500 on error
    expect(res.body).toHaveProperty("message", "Internal Server Error");
  });
});
