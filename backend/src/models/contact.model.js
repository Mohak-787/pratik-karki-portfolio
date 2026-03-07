import mongoose from "mongoose";

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: [3, "Name must be at least 3 characters long"]
  },
  phone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    required: true, 
    minlength: [5, "Email must be at least 5 characters long"],
    match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Please enter a valid email']
  },
  message: {
    type: String,
    trim: true,
    required: true
  }
}, { timestamps: true });

const Contact = mongoose.model("Contact", contactSchema);
export default Contact