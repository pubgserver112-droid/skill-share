import {v2 as cloudinary } from 'cloudinary'
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { log } from "console"
import dotenv from "dotenv";
dotenv.config();
 log("database connected... ")
        console.log("Cloudinary config:", {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_CLOUD_API_KEY,
  has_secret: !!process.env.CLOUDINARY_CLOUD_API_SECRET
});
cloudinary.config(
    {
        cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
        api_key:process.env.CLOUDINARY_CLOUD_API_KEY,
        api_secret:process.env.CLOUDINARY_CLOUD_API_SECRET,

    }
)
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    return {
      folder: 'user_avatars',
      format: file.mimetype.split('/')[1], // jpg, png, etc.
      public_id: `${Date.now()}-${file.originalname.split('.')[0]}` // unique and readable
    };
  },
});

const upload=multer({storage})

export { cloudinary,upload};
