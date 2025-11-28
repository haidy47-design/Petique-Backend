import multer from "multer";
import { AppError } from "../catch-error.js";

const fileValidation = {
  images: [
    "image/jpg",
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/bmp",
    "image/webp",
    "image/tiff",
    "image/avif",
  ],
  document: [
    "application/pdf",
    "application/msword",
    "application/rtf",
    "text/plain",
    "text/csv",
  ],
  videos: [
    "video/mp4",
    "video/x-msvideo",
    "video/x-matroska",
    "video/webm",
    "video/quicktime",
    "video/x-ms-wmv",
  ],
};
export const cloudUpload = (allowFile = fileValidation.images) => {
  const storage = multer.diskStorage({});

  const fileFilter = (req, file, cb) => {
    if (allowFile.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError("image only"), false);
    }
  };

  const upload = multer({
    storage,
    fileFilter,
    limits: {
      fieldSize: 50 * 1024 * 1024,
    },
  });
  return upload;
};

export const uploadSingleFile = (fieldName) => {
  return cloudUpload().single(fieldName);
};

export const uploadMixFiles = (arrayOfFields) => {
  return cloudUpload().fields(arrayOfFields);
};
