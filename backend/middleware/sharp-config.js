const sharp = require("sharp");
const path = require("path");

module.exports = async (req, res, next) => {
  if (!req.file) return next();

  const filename = Date.now() + "-" + req.file.originalname.replace(/\s+/g, "_");
  const outputPath = path.join("images", filename);

  await sharp(req.file.buffer)
    .resize(400)
    .jpeg({ quality: 80 })
    .toFile(outputPath);

  req.file.filename = filename;
  req.file.path = outputPath;

  next();
};
