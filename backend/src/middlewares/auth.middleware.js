import Admin from "../models/admin.model.js";
import BlacklistToken from "../models/blacklistToken.js";
import jwt from "jsonwebtoken";

const wantsHtml = (req) => {
  const acceptHeader = (req.get("accept") || "").toLowerCase();
  return acceptHeader.includes("text/html") && !acceptHeader.includes("application/json") && !req.xhr;
};

export const authAdmin = async function (req, res, next) {
  const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    if (wantsHtml(req)) {
      return res.redirect("/admin/login");
    }

    return res.status(401).json({ message: "Unauthorized: Token not found" });
  }

  const isBlacklisted = await BlacklistToken.findOne({ token });

  if (isBlacklisted) {
    if (wantsHtml(req)) {
      return res.redirect("/admin/login");
    }

    return res.status(401).json({ message: "Unauthorized: Expired token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded._id);

    if (!admin) {
      if (wantsHtml(req)) {
        return res.redirect("/admin/login");
      }

      return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }

    req.admin = admin;
    return next();
  }
  catch (error) {
    if (wantsHtml(req)) {
      return res.redirect("/admin/login");
    }

    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
}
