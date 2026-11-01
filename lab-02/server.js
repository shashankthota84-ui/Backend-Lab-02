// Lab 2: SQLite Database and CRUD Routes
// Student: THOTA SHASHANK

const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

// Initialize Express application
const app = express();

// Middleware to parse incoming JSON request bodies
app.use(express.json());

// Path to SQLite database file
const dbPath = path.join(__dirname, "books.db");

// Database instance variable
let db = null;

// Function to initialize SQLite database and start the Express server
const initializeDBAndServer = async () => {
  try {
    // Open connection to SQLite database
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    console.log("Database connected successfully");

    // Create the 'book' table if it does not already exist
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS book (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        author TEXT,
        price INTEGER,
        pages INTEGER
      );
    `;
    await db.exec(createTableQuery);

    // Check if the table is empty to prevent duplicate sample entries on restart
    const countResult = await db.get("SELECT COUNT(*) AS count FROM book;");

    if (countResult.count === 0) {
      // Insert 10 realistic sample books
      const insertSampleBooksQuery = `
        INSERT INTO book (title, author, price, pages) VALUES
        ('The Alchemist', 'Paulo Coelho', 399, 208),
        ('Atomic Habits', 'James Clear', 499, 320),
        ('To Kill a Mockingbird', 'Harper Lee', 450, 281),
        ('1984', 'George Orwell', 350, 328),
        ('The Great Gatsby', 'F. Scott Fitzgerald', 299, 180),
        ('Pride and Prejudice', 'Jane Austen', 250, 279),
        ('The Hobbit', 'J.R.R. Tolkien', 599, 310),
        ('Rich Dad Poor Dad', 'Robert Kiyosaki', 420, 336),
        ('Clean Code', 'Robert C. Martin', 850, 464),
        ('The Pragmatic Programmer', 'Andrew Hunt', 799, 352);
      `;
      await db.run(insertSampleBooksQuery);
      console.log("Sample books seeded successfully.");
    }

    // Start server on process.env.PORT or default to 3000
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    process.exit(1);
  }
};

// Start DB connection and Express server
initializeDBAndServer();

// ==========================================
// API ROUTES
// ==========================================

// 1. Root route - verify API status
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Lab 2 SQLite CRUD API is running",
  });
});

// 2. GET /books/ - Retrieve all books from SQLite
app.get("/books/", async (req, res) => {
  try {
    const getBooksQuery = `
      SELECT * FROM book ORDER BY id ASC;
    `;
    const books = await db.all(getBooksQuery);
    res.status(200).json(books);
  } catch (error) {
    console.error(`Error fetching books: ${error.message}`);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 3. GET /books/:bookId/ - Retrieve a single book by ID
app.get("/books/:bookId/", async (req, res) => {
  try {
    const { bookId } = req.params;

    // Validate that bookId is a number
    if (isNaN(bookId) || Number(bookId) <= 0) {
      return res.status(400).json({ error: "Invalid book ID" });
    }

    // Parameterized query using '?' placeholder to prevent SQL injection
    const getBookQuery = `
      SELECT * FROM book WHERE id = ?;
    `;
    const book = await db.get(getBookQuery, [bookId]);

    // If book does not exist, return 404
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    res.status(200).json(book);
  } catch (error) {
    console.error(`Error fetching book: ${error.message}`);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 4. POST /books/ - Insert and create a new book
app.post("/books/", async (req, res) => {
  try {
    const { title, author, price, pages } = req.body;

    // Validate request body
    if (
      !title || typeof title !== "string" || title.trim() === "" ||
      !author || typeof author !== "string" || author.trim() === "" ||
      price === undefined || isNaN(price) || Number(price) < 0 ||
      pages === undefined || isNaN(pages) || Number(pages) <= 0
    ) {
      return res.status(400).json({
        error: "Invalid request data. Please provide valid title, author, price, and pages.",
      });
    }

    // Parameterized query to insert the new book
    const addBookQuery = `
      INSERT INTO book (title, author, price, pages)
      VALUES (?, ?, ?, ?);
    `;
    const result = await db.run(addBookQuery, [
      title.trim(),
      author.trim(),
      Number(price),
      Number(pages),
    ]);

    // Return status 201 (Created) and the newly created book
    res.status(201).json({
      id: result.lastID,
      title: title.trim(),
      author: author.trim(),
      price: Number(price),
      pages: Number(pages),
    });
  } catch (error) {
    console.error(`Error adding book: ${error.message}`);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 5. PUT /books/:bookId/ - Update an existing book
app.put("/books/:bookId/", async (req, res) => {
  try {
    const { bookId } = req.params;

    // Validate bookId
    if (isNaN(bookId) || Number(bookId) <= 0) {
      return res.status(400).json({ error: "Invalid book ID" });
    }

    // Check if the book exists
    const checkBookQuery = `SELECT * FROM book WHERE id = ?;`;
    const existingBook = await db.get(checkBookQuery, [bookId]);

    if (!existingBook) {
      return res.status(404).json({ error: "Book not found" });
    }

    const { title, author, price, pages } = req.body;

    // Validate request body
    if (
      !title || typeof title !== "string" || title.trim() === "" ||
      !author || typeof author !== "string" || author.trim() === "" ||
      price === undefined || isNaN(price) || Number(price) < 0 ||
      pages === undefined || isNaN(pages) || Number(pages) <= 0
    ) {
      return res.status(400).json({
        error: "Invalid request data. Please provide valid title, author, price, and pages.",
      });
    }

    // Parameterized query to update the book
    const updateBookQuery = `
      UPDATE book
      SET title = ?, author = ?, price = ?, pages = ?
      WHERE id = ?;
    `;
    await db.run(updateBookQuery, [
      title.trim(),
      author.trim(),
      Number(price),
      Number(pages),
      bookId,
    ]);

    res.status(200).json({
      id: Number(bookId),
      title: title.trim(),
      author: author.trim(),
      price: Number(price),
      pages: Number(pages),
    });
  } catch (error) {
    console.error(`Error updating book: ${error.message}`);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 6. DELETE /books/:bookId/ - Delete a book by ID
app.delete("/books/:bookId/", async (req, res) => {
  try {
    const { bookId } = req.params;

    // Validate bookId
    if (isNaN(bookId) || Number(bookId) <= 0) {
      return res.status(400).json({ error: "Invalid book ID" });
    }

    // Check if the book exists
    const checkBookQuery = `SELECT * FROM book WHERE id = ?;`;
    const existingBook = await db.get(checkBookQuery, [bookId]);

    if (!existingBook) {
      return res.status(404).json({ error: "Book not found" });
    }

    // Parameterized query to delete the book
    const deleteBookQuery = `
      DELETE FROM book WHERE id = ?;
    `;
    await db.run(deleteBookQuery, [bookId]);

    res.status(200).json({
      message: "Book deleted successfully",
    });
  } catch (error) {
    console.error(`Error deleting book: ${error.message}`);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = app;
