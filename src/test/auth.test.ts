import { jest } from "@jest/globals";
import { generateSessionToken } from "../controller/auth/authController";
import jwt from "jsonwebtoken";
import { IUser } from "../models/User";

describe("generateSessionToken", () => {
  afterEach(() => {
    jest.restoreAllMocks(); // clean up spies after each test
  });

  it("should call jwt.sign with correct payload", () => {
    const fakeUser = { id: "123", username: "pranav" } as unknown as IUser;

    // Spy on jwt.sign and make it return a fake value
    const signSpy = jest
      .spyOn(jwt, "sign")
      .mockReturnValue("fakeToken" as any);

    const token = generateSessionToken(fakeUser);

    // Assertions
    expect(signSpy).toHaveBeenCalledWith(
      { userId: "123", username: "pranav" },
      "Don't tell the secret",
      { expiresIn: 60 * 60 }
    );
    expect(token).toBe("fakeToken");
  });
});