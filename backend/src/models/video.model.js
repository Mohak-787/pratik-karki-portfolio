import mongoose from "mongoose";

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true, 
    trim: true
  },
  link: {
    type: String,
    required: true, 
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['PRIMARY', 'SECONDARY'],
    default: 'SECONDARY'
  },
  client: {
    type: String,
    trim: true
  }
}, { timestamps: true });

const Video = mongoose.model("Video", videoSchema);
export default Video;