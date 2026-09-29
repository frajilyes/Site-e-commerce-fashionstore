const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");
const env = require("../config/env");
const ApiError = require("../Utils/ApiError");

const uploadDir = env.upload.dir;

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const EXTENSION_BY_MIME = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/avif": ".avif",
  "image/gif": ".gif",
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}`;
    cb(null, `${unique}${EXTENSION_BY_MIME[file.mimetype] || ".bin"}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    !env.upload.allowedMimeTypes.includes(file.mimetype) ||
    !EXTENSION_BY_MIME[file.mimetype]
  ) {
    return cb(
      ApiError.badRequest(
        `Unsupported image type (${file.mimetype}). Allowed: ${env.upload.allowedMimeTypes.join(", ")}`,
      ),
    );
  }
  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: env.upload.maxFileSize,
    files: env.upload.maxFiles,
    fields: 10,
    fieldSize: 1024,
    parts: env.upload.maxFiles + 10,
  },
});

const startsWith = (buffer, bytes, offset = 0) =>
  bytes.every((byte, i) => buffer[offset + i] === byte);

const SIGNATURES = {
  "image/jpeg": (b) => startsWith(b, [0xff, 0xd8, 0xff]),
  "image/png": (b) =>
    startsWith(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  "image/gif": (b) => b.toString("ascii", 0, 6).match(/^GIF8[79]a$/) !== null,
  "image/webp": (b) =>
    b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP",
  "image/avif": (b) =>
    b.toString("ascii", 4, 8) === "ftyp" &&
    ["avif", "avis", "mif1", "msf1"].includes(b.toString("ascii", 8, 12)),
};

const readHeader = async (filePath) => {
  const handle = await fs.promises.open(filePath, "r");
  try {
    const buffer = Buffer.alloc(16);
    await handle.read(buffer, 0, 16, 0);
    return buffer;
  } finally {
    await handle.close();
  }
};

const verifyImageContent = async (req, res, next) => {
  const files = req.file ? [req.file] : Array.isArray(req.files) ? req.files : [];

  try {
    const results = await Promise.all(
      files.map(async (file) => {
        const header = await readHeader(file.path);
        const check = SIGNATURES[file.mimetype];
        return Boolean(check && check(header));
      }),
    );

    if (results.every(Boolean)) return next();

    await Promise.all(
      files.map((file) => fs.promises.unlink(file.path).catch(() => {})),
    );
    next(ApiError.badRequest("The uploaded file is not a valid image"));
  } catch (error) {
    next(error);
  }
};

module.exports = upload;
module.exports.uploadDir = uploadDir;
module.exports.verifyImageContent = verifyImageContent;
