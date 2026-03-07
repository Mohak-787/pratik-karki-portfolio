import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const adminSchema = new mongoose.Schema({
  name: {
    firstName: {
      type: String,
      required: true,
      trim: true,
      minlength: [3, "First name must be at least 3 characters long"]
    },
    lastName: {
      type: String,
      trim: true,
      minlength: [3, "Last name must be at least 3 characters long"]
    }
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: [5, "Email must be at least 5 characters long"],
    match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    minlength: [6, "Password must be at least 6 characters long"],
    required: true,
    select: false
  }
}, { timestamps: true });

adminSchema.methods.generateAuthToken = function () {
  const token = jwt.sign({ _id: this._id }, process.env.JWT_SECRET, { expiresIn: "24h" });
  return token;
}

adminSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
}

adminSchema.statics.hashPassword = async function (password) {
  return await bcrypt.hash(password, 12);
}

const Admin = mongoose.model("Admin", adminSchema);
export default Admin;