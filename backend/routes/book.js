const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const multer = require("../middleware/multer-config");
const sharpConfig = require("../middleware/sharp-config");
const bookCtrl = require("../controllers/book");

// PUBLIC: anyone (or at least the frontend) can fetch books
router.get("/", bookCtrl.getAllBooks);
router.get("/bestrating", bookCtrl.getBestRatedBooks);
router.get("/:id", bookCtrl.getOneBook);

// PROTECTED: only authenticated users
router.post("/", auth, multer, sharpConfig, bookCtrl.createBook);
router.put("/:id", auth, multer, sharpConfig, bookCtrl.modifyBook);
router.delete("/:id", auth, bookCtrl.deleteBook);
router.post("/:id/rating", auth, bookCtrl.rateBook);

module.exports = router;
