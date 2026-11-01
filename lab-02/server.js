const express = require('express');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

const app = express();

app.use(express.json());

// Enable CORS so browser requests and external tools work smoothly
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

const PORT = process.env.PORT || 3000;

let db;

// Sample Books
const sampleBooks = [
  ['Harry Potter', 'J.K. Rowling', 500, 350],
  ['The Alchemist', 'Paulo Coelho', 300, 208],
  ['Wings of Fire', 'A.P.J. Abdul Kalam', 250, 180],
  ['Atomic Habits', 'James Clear', 450, 320],
  ['Rich Dad Poor Dad', 'Robert Kiyosaki', 350, 250],
  ['The Great Gatsby', 'F. Scott Fitzgerald', 200, 180],
  ['Think and Grow Rich', 'Napoleon Hill', 400, 280],
  ['Ikigai', 'Hector Garcia', 320, 190],
  ['The Power of Habit', 'Charles Duhigg', 380, 290],
  ['Deep Work', 'Cal Newport', 420, 300]
];

// Initialize Database and Server
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: path.join(__dirname, 'books.db'),
      driver: sqlite3.Database
    });

    console.log('Database connected successfully');

    // Create Books Table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS book (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        price INTEGER NOT NULL,
        pages INTEGER NOT NULL
      );
    `);

    // Insert sample books only if table is empty
    const count = await db.get('SELECT COUNT(*) AS count FROM book');

    if (count.count === 0) {
      for (const book of sampleBooks) {
        await db.run(
          `INSERT INTO book (title, author, price, pages) VALUES (?, ?, ?, ?)`,
          book
        );
      }
      console.log('10 sample books inserted');
    }

    // Start Server after database connection
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });

  } catch (error) {
    console.log(`Database Error: ${error.message}`);
    process.exit(1);
  }
};

// Home Route (Returns clean JSON per Lab requirements)
app.get('/', (request, response) => {
  response.status(200).json({
    message: 'Welcome to Book Store API'
  });
});

// Interactive Browser UI to visually insert, view, and delete books
app.get('/ui/', (request, response) => {
  response.setHeader('Content-Type', 'text/html');
  response.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Book Store Management UI</title>
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
      <h1>📚 Book Store Management</h1>
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
          showMsg('Book inserted successfully (Status: 201 Created)');
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

    fetchBooks();
  </script>
</body>
</html>
  `);
});

// 1. GET All Books
app.get('/books/', async (request, response) => {
  try {
    const books = await db.all('SELECT * FROM book ORDER BY id');
    response.status(200).json(books);
  } catch (error) {
    response.status(500).json({ error: error.message });
  }
});

// 2. GET Book by ID
app.get('/books/:bookId/', async (request, response) => {
  try {
    const { bookId } = request.params;
    const book = await db.get('SELECT * FROM book WHERE id = ?', [bookId]);

    if (!book) {
      return response.status(404).json({
        error: 'Book not found'
      });
    }

    response.status(200).json(book);
  } catch (error) {
    response.status(500).json({ error: error.message });
  }
});

// 3. POST - Add New Book
app.post('/books/', async (request, response) => {
  try {
    const { title, author, price, pages } = request.body;

    // Support both numeric and numeric string inputs safely
    const numPrice = Number(price);
    const numPages = Number(pages);

    if (
      typeof title !== 'string' || !title.trim() ||
      typeof author !== 'string' || !author.trim() ||
      isNaN(numPrice) || numPrice < 0 ||
      isNaN(numPages) || numPages <= 0
    ) {
      return response.status(400).json({
        error: 'Please provide valid title, author, price and pages'
      });
    }

    const result = await db.run(
      `INSERT INTO book (title, author, price, pages) VALUES (?, ?, ?, ?)`,
      [title.trim(), author.trim(), numPrice, numPages]
    );

    response.status(201).json({
      message: 'Book Added Successfully',
      bookId: result.lastID
    });
  } catch (error) {
    response.status(500).json({ error: error.message });
  }
});

// 4. PUT - Update Book
app.put('/books/:bookId/', async (request, response) => {
  try {
    const { bookId } = request.params;
    const { title, author, price, pages } = request.body;

    const numPrice = Number(price);
    const numPages = Number(pages);

    if (
      typeof title !== 'string' || !title.trim() ||
      typeof author !== 'string' || !author.trim() ||
      isNaN(numPrice) || numPrice < 0 ||
      isNaN(numPages) || numPages <= 0
    ) {
      return response.status(400).json({
        error: 'Please provide valid title, author, price and pages'
      });
    }

    const result = await db.run(
      `UPDATE book SET title = ?, author = ?, price = ?, pages = ? WHERE id = ?`,
      [title.trim(), author.trim(), numPrice, numPages, bookId]
    );

    if (result.changes === 0) {
      return response.status(404).json({
        error: 'Book not found'
      });
    }

    response.status(200).json({
      message: 'Book Updated Successfully'
    });
  } catch (error) {
    response.status(500).json({ error: error.message });
  }
});

// 5. DELETE - Remove Book
app.delete('/books/:bookId/', async (request, response) => {
  try {
    const { bookId } = request.params;
    const result = await db.run('DELETE FROM book WHERE id = ?', [bookId]);

    if (result.changes === 0) {
      return response.status(404).json({
        error: 'Book not found'
      });
    }

    response.status(200).json({
      message: 'Book Deleted Successfully'
    });
  } catch (error) {
    response.status(500).json({ error: error.message });
  }
});

// Handle Unknown Routes
app.use((request, response) => {
  response.status(404).json({
    error: 'Route Not Found'
  });
});

// Initialize Application
initializeDBAndServer();