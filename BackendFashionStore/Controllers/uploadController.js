
const fs = require("fs/promises");
const path = require("path");
const env = require("../config/env");
const ApiError = require("../Utils/ApiError");
const asyncHandler = require("../Utils/asyncHandler");

const publicUrl = (req, filename) =>
  `${req.protocol}://${req.get("host")}${env.upload.publicPath}/${filename}`;

const describe = (req, file) => ({
  url: publicUrl(req, file.filename),
  path: `${env.upload.publicPath}/${file.filename}`,
  filename: file.filename,
  mimeType: file.mimetype,
  size: file.size,
});

const uploadSingle = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest("No image received (field name: 'image')");
  }

  res.status(201).json(describe(req, req.file));
});

const uploadMultiple = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw ApiError.badRequest("No images received (field name: 'images')");
  }

  const files = req.files.map((file) => describe(req, file));

  res.status(201).json({
    urls: files.map((file) => file.url),
    files: files,
    total: files.length,
  });
});

const deleteUpload = asyncHandler(async (req, res) => {
  const filename = path.basename(String(req.params.filename || ""));
  if (!/^[\w-]+\.(jpg|png|webp|avif|gif)$/i.test(filename)) {
    throw ApiError.badRequest("Invalid file name");
  }

  const target = path.join(env.upload.dir, filename);

  try {
    await fs.unlink(target);
  } catch (error) {
    if (error.code === "ENOENT") {
      throw ApiError.notFound("File not found");
    }
    throw error;
  }

  res.status(200).json({ message: "File deleted successfully", filename });
});

module.exports = { uploadSingle, uploadMultiple, deleteUpload, publicUrl };
