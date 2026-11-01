# Lab 2: SQLite Database and CRUD Routes

**Name:** THOTA SHASHANK  
**Registration Number:** [PLACEHOLDER - I WILL ENTER IT]  
**Section:** [PLACEHOLDER - I WILL ENTER IT]  

**Live Link:**  
[ADD AFTER DEPLOYMENT]

---

## Objective

The objective of this laboratory project is to build a RESTful CRUD API using Node.js and Express connected to a local SQLite database (`books.db`). The lab focuses on:
- Establishing a reliable asynchronous database connection before starting the HTTP server.
- Creating and seeding relational tables.
- Implementing safe parameterized queries (`?` placeholders) to prevent SQL injection vulnerabilities.
- Handling full CRUD operations over HTTP with appropriate status codes (`200`, `201`, `400`, `404`, `500`).

---

## Technologies Used

- **Node.js**: Asynchronous event-driven JavaScript runtime environment.
- **Express.js**: Minimalist web application framework for routing and middleware.
- **SQLite**: Lightweight, serverless, self-contained SQL database engine stored in `books.db`.
- **sqlite3**: Driver that bridges Node.js with SQLite.
- **sqlite**: Promise-based wrapper enabling modern `async/await` syntax for SQLite.
- **nodemon**: Development tool that automatically restarts the Node server upon code changes.
- **Postman**: API development environment used to test and verify HTTP requests.

---

## Project Structure

```text
lab-02/
│
├── package.json         # Project configuration, dependencies, and npm scripts
├── package-lock.json    # Exact versions lockfile
├── server.js            # Express server, SQLite initialization, and CRUD routes
├── books.db             # Local SQLite database file containing the 'book' table
├── .gitignore           # Ignores node_modules/ and .env, tracks books.db
├── README.md            # Lab report, endpoint specs, and Viva questions & answers
│
└── screenshots/         # Submission screenshots folder
    ├── server-running.png
    ├── get-all-books.png
    ├── get-one-book.png
    ├── book-not-found.png
    ├── post-book.png
    ├── put-book.png
    ├── delete-book.png
    ├── database-view.png
    └── .gitkeep
```

---

## How to Install

1. Open terminal and navigate to the project directory:
   ```bash
   cd lab-02
   ```

2. Install all required dependencies:
   ```bash
   npm install
   ```

---

## How to Run

### Development Mode (with automatic restart via nodemon):
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

### Expected Terminal Output on Startup:
```text
Database connected successfully
Server running at http://localhost:3000
```

---

## Database

- **Database File:** `books.db`
- **Table Name:** `book`

### Table Schema:
```sql
CREATE TABLE IF NOT EXISTS book (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  author TEXT,
  price INTEGER,
  pages INTEGER
);
```

### Columns:
| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Auto-incrementing unique identifier |
| `title` | `TEXT` | Required | Title of the book |
| `author` | `TEXT` | Required | Author name |
| `price` | `INTEGER` | Required | Book price in INR |
| `pages` | `INTEGER` | Required | Total page count |

### Pre-Seeded Sample Records:
The server checks `SELECT COUNT(*) AS count FROM book;` upon startup. If empty, it automatically seeds 10 sample books:
1. *The Alchemist* by Paulo Coelho (Price: 399, Pages: 208)
2. *Atomic Habits* by James Clear (Price: 499, Pages: 320)
3. *To Kill a Mockingbird* by Harper Lee (Price: 450, Pages: 281)
4. *1984* by George Orwell (Price: 350, Pages: 328)
5. *The Great Gatsby* by F. Scott Fitzgerald (Price: 299, Pages: 180)
6. *Pride and Prejudice* by Jane Austen (Price: 250, Pages: 279)
7. *The Hobbit* by J.R.R. Tolkien (Price: 599, Pages: 310)
8. *Rich Dad Poor Dad* by Robert Kiyosaki (Price: 420, Pages: 336)
9. *Clean Code* by Robert C. Martin (Price: 850, Pages: 464)
10. *The Pragmatic Programmer* by Andrew Hunt (Price: 799, Pages: 352)

---

## Database Verification

You can verify the database contents directly from the terminal at any time using:

```bash
npm run db:view
```

Or using SQLite CLI (if installed):
```bash
sqlite3 books.db "SELECT * FROM book;"
```

This displays the complete rows in formatted tabular view, allowing you to observe that:
- `POST` adds a new row with an auto-incremented ID.
- `PUT` modifies existing columns.
- `DELETE` removes the row.

---

## API Endpoints

| Method | Endpoint | Purpose | Success Status | Error Status |
| :--- | :--- | :--- | :--- | :--- |
| **`GET`** | `/` | Check server status | `200 OK` | `500 Internal Server Error` |
| **`GET`** | `/books/` | Get all books | `200 OK` | `500 Internal Server Error` |
| **`GET`** | `/books/:bookId/` | Get one book by ID | `200 OK` | `400 Bad Request` / `404 Not Found` |
| **`POST`** | `/books/` | Add a new book | `201 Created` | `400 Bad Request` / `500 Internal Server Error` |
| **`PUT`** | `/books/:bookId/` | Update existing book | `200 OK` | `400 Bad Request` / `404 Not Found` |
| **`DELETE`** | `/books/:bookId/` | Delete book by ID | `200 OK` | `400 Bad Request` / `404 Not Found` |

### Error Cases Handled:
- **`400 Bad Request`**: Sent if `bookId` is not a valid positive integer (e.g., `/books/abc/`), or if required JSON body fields (`title`, `author`, `price`, `pages`) are missing/invalid in `POST` or `PUT`.
- **`404 Not Found`**: Sent if the requested `bookId` does not exist in SQLite (e.g., `/books/999/`).
  ```json
  {
    "error": "Book not found"
  }
  ```
- **`500 Internal Server Error`**: Sent if an unhandled database error occurs.

---

## Postman Testing Guide

Set header for all `POST` and `PUT` requests:
```text
Content-Type: application/json
```

### 1. Root Check
- **Method:** `GET`
- **URL:** `http://localhost:3000/`
- **Status:** `200 OK`
- **Response:**
  ```json
  {
    "message": "Lab 2 SQLite CRUD API is running"
  }
  ```

### 2. GET All Books
- **Method:** `GET`
- **URL:** `http://localhost:3000/books/`
- **Status:** `200 OK`
- **Response:** Array of all book objects.

### 3. GET One Book
- **Method:** `GET`
- **URL:** `http://localhost:3000/books/1/`
- **Status:** `200 OK`
- **Response:**
  ```json
  {
    "id": 1,
    "title": "The Alchemist",
    "author": "Paulo Coelho",
    "price": 399,
    "pages": 208
  }
  ```

### 4. Book Not Found (404 Case)
- **Method:** `GET`
- **URL:** `http://localhost:3000/books/999/`
- **Status:** `404 Not Found`
- **Response:**
  ```json
  {
    "error": "Book not found"
  }
  ```

### 5. POST (Add Book)
- **Method:** `POST`
- **URL:** `http://localhost:3000/books/`
- **Request Body (raw JSON):**
  ```json
  {
    "title": "Deep Work",
    "author": "Cal Newport",
    "price": 450,
    "pages": 304
  }
  ```
- **Status:** `201 Created`
- **Response:**
  ```json
  {
    "id": 11,
    "title": "Deep Work",
    "author": "Cal Newport",
    "price": 450,
    "pages": 304
  }
  ```

### 6. PUT (Update Book)
- **Method:** `PUT`
- **URL:** `http://localhost:3000/books/1/`
- **Request Body (raw JSON):**
  ```json
  {
    "title": "The Alchemist - Updated",
    "author": "Paulo Coelho",
    "price": 499,
    "pages": 220
  }
  ```
- **Status:** `200 OK`
- **Response:**
  ```json
  {
    "id": 1,
    "title": "The Alchemist - Updated",
    "author": "Paulo Coelho",
    "price": 499,
    "pages": 220
  }
  ```

### 7. DELETE Book
- **Method:** `DELETE`
- **URL:** `http://localhost:3000/books/1/`
- **Status:** `200 OK`
- **Response:**
  ```json
  {
    "message": "Book deleted successfully"
  }
  ```

---

## Parameterized Queries & SQL Injection Prevention

Every SQL query receiving dynamic parameters uses `?` placeholders instead of string concatenation:

```javascript
// SECURE: Parameterized Query
const getBookQuery = `SELECT * FROM book WHERE id = ?;`;
const book = await db.get(getBookQuery, [bookId]);
```

### Why Parameterized Queries Prevent SQL Injection:
1. **Pre-compilation and Separation:** The database engine prepares and compiles the SQL statement structure independently before binding any parameters.
2. **Literal Binding:** Variables passed into the query are bound strictly as data literals (strings or numbers), never executed as SQL instructions.
3. **Neutralizing Exploits:** If an attacker sends malicious input like `' 1 OR 1=1 --`, SQLite treats the entire string as a literal text value searching for an ID matching that exact string, making injection impossible.

---

## Important SQLite Deployment Note

Because SQLite stores data in a single local disk file (`books.db`), cloud platforms (such as Render free tier) use **ephemeral filesystems**.
- When the container restarts or re-spins after idling, any newly inserted rows (`POST`) or modifications (`PUT`/`DELETE`) revert to the repository state.
- For this educational laboratory, SQLite is specifically required to demonstrate database CRUD mechanics without external network setup.

---

## Screenshots

> **Note for Submission:** Capture the following screenshots and save them into the `screenshots/` directory before final submission.

### Server Running
*(TODO: Capture terminal showing `npm run dev` startup output)*  
![Server Running](screenshots/server-running.png)

### GET All Books
*(TODO: Capture Postman `GET http://localhost:3000/books/`)*  
![GET All Books](screenshots/get-all-books.png)

### GET One Book
*(TODO: Capture Postman `GET http://localhost:3000/books/1/`)*  
![GET One Book](screenshots/get-one-book.png)

### Book Not Found
*(TODO: Capture Postman `GET http://localhost:3000/books/999/` with 404)*  
![Book Not Found](screenshots/book-not-found.png)

### POST Book
*(TODO: Capture Postman `POST http://localhost:3000/books/` with 201 Created)*  
![POST Book](screenshots/post-book.png)

### PUT Book
*(TODO: Capture Postman `PUT http://localhost:3000/books/1/` with 200 OK)*  
![PUT Book](screenshots/put-book.png)

### DELETE Book
*(TODO: Capture Postman `DELETE http://localhost:3000/books/1/`)*  
![DELETE Book](screenshots/delete-book.png)

### SQLite Database
*(TODO: Capture terminal running `npm run db:view` showing table)*  
![SQLite Database](screenshots/database-view.png)

---

## Viva Questions and Answers

### 1. What is SQLite?
**Answer:** SQLite is a lightweight, serverless, self-contained relational database management system (RDBMS) that stores data inside a single disk file (`books.db`) rather than requiring an external database server process.

### 2. What is CRUD?
**Answer:** CRUD stands for Create, Read, Update, and Delete. These are the four foundational operations performed on persistent data in applications.

### 3. Why do we use async/await?
**Answer:** Database file I/O operations are asynchronous. `async/await` allows us to handle asynchronous operations cleanly, making code readable and synchronous-looking without callback hell or promise chaining.

### 4. Why is initializeDBAndServer() async?
**Answer:** Because opening the SQLite file and creating the SQL table are asynchronous operations (`await open(...)` and `await db.exec(...)`). The function must be declared `async` to use the `await` keyword.

### 5. Why must the server start after database connection?
**Answer:** If the Express server starts accepting requests before the database connection is resolved, incoming API calls will fail with a null reference error because the `db` variable is not yet initialized.

### 6. What is SQL injection?
**Answer:** SQL injection is a security vulnerability where an attacker injects malicious SQL fragments into input fields, altering the executed query to read, tamper with, or delete database data.

### 7. How do ? placeholders prevent SQL injection?
**Answer:** Placeholders (`?`) instruct the database driver to treat input strictly as parameter data literals, ensuring that user inputs can never be parsed or executed as SQL commands.

### 8. Why do we use parameterized queries?
**Answer:** Parameterized queries guarantee code safety against SQL injection attacks, automatically escape special characters, and improve database query optimization and performance.

### 9. Difference between POST and PUT?
**Answer:**
- `POST`: Used to create a new resource on the server (generates a new record with a new ID).
- `PUT`: Used to update or overwrite an existing resource identified by a specific ID (e.g., `/books/:bookId/`).

### 10. What is req.params?
**Answer:** `req.params` is an Express object containing path parameters defined in the route URL, such as `req.params.bookId` for `/books/:bookId/`.

### 11. What is req.body?
**Answer:** `req.body` is an Express object that contains data sent by the client in the HTTP request payload (parsed by `express.json()`).

### 12. What is res.status().json()?
**Answer:** `res.status()` sets the HTTP response status code (e.g., 200, 201, 404), and `.json()` formats JavaScript data into a JSON string and sends it as the HTTP response body with header `Content-Type: application/json`.

### 13. Why use nodemon?
**Answer:** `nodemon` is a developer tool that watches project files for changes and automatically restarts the Node.js server, saving time during development.

### 14. Why use process.env.PORT?
**Answer:** Cloud platforms like Render assign a dynamic port at runtime via the `PORT` environment variable. `process.env.PORT || 3000` enables the application to run smoothly both on cloud hosts and locally on port 3000.

### 15. What happens when a book does not exist?
**Answer:** The query `SELECT * FROM book WHERE id = ?;` returns `undefined`. The route checks if `!book` and sends an HTTP `404 Not Found` response with `{ "error": "Book not found" }`.

### 16. Why is POST 201 instead of 200?
**Answer:** HTTP status code `201 Created` specifically signifies that the request succeeded and resulted in the creation of a new database resource, which is more accurate than generic `200 OK`.

### 17. Why is node_modules ignored?
**Answer:** `node_modules` contains thousands of third-party package files that consume large disk space. Because `package.json` tracks dependencies, anyone can regenerate `node_modules` by running `npm install`.

### 18. Why can SQLite be problematic for persistent cloud deployment?
**Answer:** Many cloud container providers (like Render free tier) use ephemeral file systems. When the server sleeps or restarts, local disk files like `books.db` are reset to the initial deployment state unless a persistent disk volume is mounted.
