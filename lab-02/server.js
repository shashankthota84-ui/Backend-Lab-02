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

// Enable CORS so browser requests from any origin work smoothly
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

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

// Interactive Browser UI to insert, view, and delete books live
app.get("/ui/", (req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Lab 2: SQLite Book Management UI</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background-color: #0f172a; color: #f1f5f9; padding: 24px 16px; }
    .container { max-width: 900px; margin: 0 auto; }
    header { text-align: center; margin-bottom: 28px; }
    h1 { font-size: 28px; color: #38bdf8; margin-bottom: 8px; }
    p.subtitle { color: #94a3b8; font-size: 14px; }
    .card { background: #1e293b; border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid #334155; }
    h2 { font-size: 18px; color: #f8fafc; margin-bottom: 16px; }
    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 16px; }
    input { background: #0f172a; border: 1px solid #475569; color: #fff; padding: 10px 12px; border-radius: 6px; font-size: 14px; width: 100%; }
    input:focus { outline: none; border-color: #38bdf8; }
    button { background: #2563eb; color: #fff; border: none; padding: 10px 20px; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; transition: 0.2s; }
    button:hover { background: #1d4ed8; }
    button.delete-btn { background: #dc2626; padding: 6px 12px; font-size: 12px; }
    button.delete-btn:hover { background: #b91c1c; }
    .notification { padding: 12px; border-radius: 6px; font-size: 14px; margin-bottom: 16px; display: none; }
    .notification.success { background: #065f46; color: #a7f3d0; border: 1px solid #059669; }
    .notification.error { background: #7f1d1d; color: #fecaca; border: 1px solid #dc2626; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { text-align: left; padding: 12px 14px; border-bottom: 1px solid #334155; font-size: 14px; }
    th { color: #94a3b8; font-weight: 600; background: #1e293b; }
    tr:hover { background: rgba(56, 189, 248, 0.05); }
    .badge { background: #0284c7; color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>📚 SQLite Books Management</h1>
      <p class="subtitle">Lab 2: Interactive Browser CRUD Interface | Connected to SQLite (books.db)</p>
    </header>

    <div id="msg" class="notification"></div>

    <!-- INSERT BOOK FORM -->
    <div class="card">
      <h2>➕ Add a New Book (POST /books/)</h2>
      <form id="addBookForm">
        <div class="form-grid">
          <div>
            <input type="text" id="title" placeholder="Book Title (e.g. Deep Work)" required />
          </div>
          <div>
            <input type="text" id="author" placeholder="Author (e.g. Cal Newport)" required />
          </div>
          <div>
            <input type="number" id="price" placeholder="Price (INR)" required />
          </div>
          <div>
            <input type="number" id="pages" placeholder="Total Pages" required />
          </div>
        </div>
        <button type="submit">Insert Book</button>
      </form>
    </div>

    <!-- BOOKS TABLE -->
    <div class="card">
      <h2>📖 All Books in Database (GET /books/)</h2>
      <div style="overflow-x:auto;">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Author</th>
              <th>Price</th>
              <th>Pages</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="booksTableBody">
            <tr><td colspan="6" style="text-align:center; color:#94a3b8;">Loading books...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <script>
    const msgEl = document.getElementById('msg');
    function showMsg(text, isError = false) {
      msgEl.className = 'notification ' + (isError ? 'error' : 'success');
      msgEl.textContent = text;
      msgEl.style.display = 'block';
      setTimeout(() => { msgEl.style.display = 'none'; }, 4000);
    }

    async function fetchBooks() {
      try {
        const res = await fetch('/books/');
        const books = await res.json();
        const tbody = document.getElementById('booksTableBody');
        tbody.innerHTML = '';
        if (books.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#94a3b8;">No books found.</td></tr>';
          return;
        }
        books.forEach(b => {
          const row = document.createElement('tr');
          row.innerHTML = \`
            <td><span class="badge">#\${b.id}</span></td>
            <td><strong>\${b.title}</strong></td>
            <td>\${b.author}</td>
            <td>₹\${b.price}</td>
            <td>\${b.pages}</td>
            <td>
              <button class="delete-btn" onclick="deleteBook(\${b.id}, '\${b.title.replace(/'/g, "\\\\'")}')">Delete</button>
            </td>
          \`;
          tbody.appendChild(row);
        });
      } catch (err) {
        showMsg('Error loading books: ' + err.message, true);
      }
    }

    // Insert Book (POST)
    document.getElementById('addBookForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('title').value;
      const author = document.getElementById('author').value;
      const price = Number(document.getElementById('price').value);
      const pages = Number(document.getElementById('pages').value);

      try {
        const res = await fetch('/books/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, author, price, pages })
        });
        const data = await res.json();
        if (res.status === 201) {
          showMsg('Book inserted successfully with ID #' + data.id + ' (Status: 201 Created)');
          document.getElementById('addBookForm').reset();
          fetchBooks();
        } else {
          showMsg(data.error || 'Failed to add book', true);
        }
      } catch (err) {
        showMsg('Error adding book: ' + err.message, true);
      }
    });

    // Delete Book (DELETE)
    async function deleteBook(id, title) {
      if (!confirm('Are you sure you want to delete "' + title + '" (ID: ' + id + ')?')) {
        return;
      }
      try {
        const res = await fetch('/books/' + id + '/', { method: 'DELETE' });
        const data = await res.json();
        if (res.ok) {
          showMsg('Book ID #' + id + ' deleted successfully (Status: 200 OK)');
          fetchBooks();
        } else {
          showMsg(data.error || 'Failed to delete book', true);
        }
      } catch (err) {
        showMsg('Error deleting book: ' + err.message, true);
      }
    }

    // Initial load
    fetchBooks();
  </script>
</body>
</html>
  `);
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
