import express from "express";
import Video from "../models/video.model.js";

const router = express.Router();

/* GET /video/primary-videos */
router.route("/primary-videos").get(async (_req, res) => {
  try {
    const videos = await Video.find({ type: "PRIMARY" }).sort({ createdAt: -1 }).lean();

    return res.status(200).json({
      message: videos.length ? "Primary videos fetched successfully" : "No primary videos",
      videos,
      success: true
    });
  }
  catch (error) {
    return res.status(500).json({
      message: `Internal server error: ${error.message}`,
      success: false
    });
  }
});

/* GET /video/secondary-videos */
router.route("/secondary-videos").get(async (_req, res) => {
  try {
    const videos = await Video.find({ type: "SECONDARY" }).sort({ createdAt: -1 }).lean();

    return res.status(200).json({
      message: videos.length ? "Secondary videos fetched successfully" : "No secondary videos",
      videos,
      success: true
    });
  }
  catch (error) {
    return res.status(500).json({
      message: `Internal server error: ${error.message}`,
      success: false
    });
  }
});

export default router;
