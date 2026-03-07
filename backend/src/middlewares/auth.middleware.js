import Admin from "../models/admin.model.js";
import BlacklistToken from "../models/blacklistToken.js";
import jwt from "jsonwebtoken";

export const authAdmin = async function (req, res, next) {
  const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: Token not found" });
  }

  const isBlacklisted = await BlacklistToken.findOne({ token });

  if (isBlacklisted) {
    return res.status(401).json({ message: "Unauthorized: Expired token" });
  }

  try {

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded._id);

    req.admin = admin;
    return next();

  } catch (error) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
}
