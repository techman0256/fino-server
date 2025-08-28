import request from "supertest";
import app from "../app";

describe("Auth Routes", () => {
  describe("GET /auth", () => {
    it("should return welcome message", async () => {
      const response = await request(app)
        .get("/auth")
        .expect(200);

      expect(response.body).toEqual({
        message: "This is not the auth routes"
      });
    });

    it("should return JSON content type", async () => {
      const response = await request(app)
        .get("/auth")
        .expect(200)
        .expect("Content-Type", /json/);

      expect(response.body.message).toBe("This is the auth routes");
    });
  });
});
