const jwt  = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Protect routes — verifies the Bearer token in the Authorization header.
 * Attaches the full user document to req.user on success.
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: "Not authorized — no token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user    = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ success: false, message: "User belonging to this token no longer exists." });
    }

    req.user = user;
    next();
  } catch (err) {
    const message =
      err.name === "TokenExpiredError" ? "Token has expired. Please log in again." :
      err.name === "JsonWebTokenError"  ? "Invalid token. Please log in again."    :
      "Authentication failed.";

    return res.status(401).json({ success: false, message });
  }
};

/**
 * Generate a signed JWT for a given user ID.
 */
const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

/**
 * Send a token response with the user object.
 */
const sendTokenResponse = (user, statusCode, res) => {
  const token = signToken(user._id);

  return res.status(statusCode).json({
    success: true,
    token,
    user,
  });
};

module.exports = { protect, signToken, sendTokenResponse };
