const test = require("node:test");
const assert = require("node:assert/strict");
const errorHandler = require("../src/middleware/errorHandler");

const createRes = () => {
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  return res;
};

test("returns default 500 response for unknown errors", () => {
  const req = {};
  const res = createRes();
  const err = new Error("Unexpected");

  errorHandler(err, req, res, () => {});

  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, {
    success: false,
    message: "Unexpected",
  });
});

test("maps duplicate key errors to 409", () => {
  const req = {};
  const res = createRes();
  const err = {
    code: 11000,
    keyValue: { email: "taken@example.com" },
    message: "Duplicate",
  };

  errorHandler(err, req, res, () => {});

  assert.equal(res.statusCode, 409);
  assert.deepEqual(res.body, {
    success: false,
    message: "Email already in use.",
  });
});

test("maps JWT expiration errors to 401", () => {
  const req = {};
  const res = createRes();
  const err = { name: "TokenExpiredError", message: "jwt expired" };

  errorHandler(err, req, res, () => {});

  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, {
    success: false,
    message: "Token expired.",
  });
});
