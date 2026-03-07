import Video from "../models/video.model.js";

export const createVideo = async ({
  title, link, type, client
}) => {
  if (!title || !link) {
    throw new Error('All fields are required');
  }

  const video = await Video.create({
    title, link, client, type
  });

  return video;
}