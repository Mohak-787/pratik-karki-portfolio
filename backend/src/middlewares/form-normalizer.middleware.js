export const normalizeAdminSignupForm = (req, res, next) => {
  const body = req.body || {};

  const hasNameObject = body.name && typeof body.name === "object" && !Array.isArray(body.name);
  if (!hasNameObject) {
    body.name = {};
  }

  const firstNameFromDot = body["name.firstName"];
  const lastNameFromDot = body["name.lastName"];

  body.name.firstName =
    body.name.firstName ||
    body.firstName ||
    firstNameFromDot ||
    "";

  body.name.lastName =
    body.name.lastName ||
    body.lastName ||
    lastNameFromDot ||
    "";

  req.body = body;
  next();
};

export const normalizeAdminLoginForm = (req, res, next) => {
  const body = req.body || {};

  body.email = body.email || body.userEmail || body["user.email"] || "";
  body.password = body.password || body.pass || body["user.password"] || "";

  req.body = body;
  next();
};
