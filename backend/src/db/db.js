import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log("Successfully connected to DB: ", conn.connection.host);
  } 
  catch (error) {
    console.error('Error in connecting db: ', error);
    res.status(500).json({
      message: `Internal server error: ${error.message}`,
      success: false
    });
    process.exit(1);
  }
}