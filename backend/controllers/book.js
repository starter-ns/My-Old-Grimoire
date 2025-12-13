const Book = require("../models/Book");
const fs = require("fs");
const mongoose = require("mongoose");

// GET ALL BOOKS
exports.getAllBooks = (req, res, next) => {
  Book.find()
    .then(books => res.status(200).json(books))
    .catch(error => res.status(400).json({ error }));
};

// GET BEST RATED (TOP 3)
exports.getBestRatedBooks = (req, res, next) => {
  Book.find()
    .sort({ averageRating: -1 }) // highest rating first
    .limit(3)
    .then(books => res.status(200).json(books))
    .catch(error => res.status(400).json({ error }));
};

// GET ONE BOOK
exports.getOneBook = (req, res, next) => {
  Book.findById(req.params.id)
    .then(book => res.status(200).json(book))
    .catch(error => res.status(404).json({ error }));
};

// CREATE BOOK
exports.createBook = (req, res, next) => {
  const bookObject = JSON.parse(req.body.book);

  // Never trust client for these:
  delete bookObject._id;
  delete bookObject.userId;
  delete bookObject.ratings;
  delete bookObject.averageRating;

  const book = new Book({
    ...bookObject,
    userId: req.auth.userId,
    imageUrl: `${req.protocol}://${req.get("host")}/images/${req.file.filename}`,
    ratings: [],
    averageRating: 0
  });

  book.save()
    .then(() => res.status(201).json({ message: "Book created!" }))
    .catch(error => res.status(400).json({ error }));
};

// MODIFY BOOK
exports.modifyBook = (req, res, next) => {
  const bookObject = req.file
    ? {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get("host")}/images/${req.file.filename}`,
      }
    : { ...req.body };

  delete bookObject.userId;

  Book.findById(req.params.id)
    .then(book => {
      if (!book) {
        return res.status(404).json({ error: "Book not found" });
      }

      if (book.userId !== req.auth.userId) {
        return res.status(403).json({ message: "Unauthorized request!" });
      }

      if (req.file) {
        const filename = book.imageUrl.split("/images/")[1];
        fs.unlink(`images/${filename}`, () => {});
      }

      Book.updateOne(
        { _id: req.params.id },
        { ...bookObject, _id: req.params.id }
      )
        .then(() => res.status(200).json({ message: "Book updated!" }))
        .catch(error => res.status(400).json({ error }));
    })
    .catch(error => res.status(500).json({ error }));
};

// DELETE BOOK
exports.deleteBook = (req, res, next) => {
  const { id } = req.params;

  // If id is not even a valid ObjectId → 404 directly
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "Book not found" });
  }

  Book.findById(id)
    .then(book => {
      if (!book) {
        return res.status(404).json({ error: "Book not found" });
      }

      if (book.userId !== req.auth.userId) {
        return res.status(403).json({ message: "Unauthorized request!" });
      }

      const filename = book.imageUrl.split("/images/")[1];

      fs.unlink(`images/${filename}`, (err) => {
        if (err) {
          console.error("Error deleting image file:", err);
          // we continue anyway to delete the book from DB
        }

        Book.deleteOne({ _id: id })
          .then(() => res.status(200).json({ message: "Book deleted!" }))
          .catch(error => res.status(400).json({ error }));
      });
    })
    .catch(error => {
      // If something weird still happens, log it but don't pretend it's "normal"
      console.error("Error in deleteBook:", error);
      // You *can* treat CastError as 404 too if you like:
      if (error.name === "CastError") {
        return res.status(404).json({ error: "Book not found" });
      }
      res.status(500).json({ error });
    });
};


// RATE BOOK
exports.rateBook = (req, res, next) => {
  const userId = req.auth.userId;
  const grade = req.body.rating;

  // Validate rating range
  if (typeof grade !== "number" || grade < 0 || grade > 5) {
    return res.status(400).json({ message: "Rating must be between 0 and 5." });
  }

  Book.findById(req.params.id)
    .then(book => {
      if (!book) {
        return res.status(404).json({ error: "Book not found" });
      }

      // Prevent double rating
      if (book.ratings.find(r => r.userId === userId)) {
        return res
          .status(400)
          .json({ message: "User already rated this book!" });
      }

      book.ratings.push({ userId, grade });

      const total = book.ratings.reduce((sum, r) => sum + r.grade, 0);
      book.averageRating = total / book.ratings.length;

      book.save()
        .then(updatedBook => res.status(200).json(updatedBook))
        .catch(error => res.status(400).json({ error }));
    })
    .catch(error => res.status(400).json({ error }));
};
