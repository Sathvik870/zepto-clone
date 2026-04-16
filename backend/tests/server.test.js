const request = require("supertest");
const { app } = require("../server");

describe("Backend API", () => {
  it("GET / should return welcome message", async () => {
    const res = await request(app).get("/");
    
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain("Welcome");
  });
});
