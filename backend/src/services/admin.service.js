import Admin from "../models/admin.model.js";

export const createAdmin = async ({
  firstName, lastName, email, password
}) => {
  if (!firstName || !email || !password) {
    throw new Error('All fields are required');
  }

  const admin = await Admin.create({
    name: {
      firstName, lastName
    },
    email,
    password
  });

  return admin;
}