import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pkg from "pg";

dotenv.config();
const { Pool } = pkg;

// ✅ PostgreSQL Database Connection
const pool = new Pool({
  connectionString: process.env.DB_URL,
  ssl: { rejectUnauthorized: false }, // ✅ Required for Supabase
});

const app = express();
app.use(express.json());
app.use(cors({ credentials: true, origin: "http://localhost:5173" })); // ✅ Adjust for deployment

/* =====================================
   🔹 ADMIN AUTHENTICATION ROUTES
   ===================================== */

// ✅ Admin Login (No Hashing)
app.post("/admin-login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query("SELECT * FROM admin WHERE email = $1", [email]);

    if (result.rows.length === 0) {
      console.log("❌ Admin not found in DB");
      return res.status(403).json({ message: "Admin not found" });
    }

    const storedPassword = result.rows[0].password;

    // 🔹 Directly compare passwords without hashing
    if (password === storedPassword) {
      res.json({ message: "Login successful!", admin: true, token: "dummy_token" });
    } else {
      console.log("❌ Incorrect Password");
      res.status(400).json({ message: "Incorrect password" });
    }
  } catch (err) {
    console.error("🔥 Server Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/* =====================================
   🔹 START SERVER
   ===================================== */
app.listen(5000, () => console.log("🔥 Server running on port 5000"));

/* =====================================
   🔹 QUIZZES CRUD (Create, Read, Update, Delete) 
   ===================================== */

// ✅ Create a Quiz
app.post("/quiz", async (req, res) => {
  const { title, description } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO quizzes (title, description) VALUES ($1, $2) RETURNING *",
      [title, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("🔥 Quiz Creation Error:", err.message);
    res.status(500).json({ error: "Failed to create quiz" });
  }
});

// ✅ Get All Quizzes
app.get("/quizzes", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM quizzes");
    res.json(result.rows);
  } catch (err) {
    console.error("🔥 Fetch Quizzes Error:", err.message);
    res.status(500).json({ error: "Failed to retrieve quizzes" });
  }
});

// ✅ Update a Quiz
app.put("/quiz/:id", async (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;
  try {
    await pool.query(
      "UPDATE quizzes SET title = $1, description = $2 WHERE id = $3",
      [title, description, id]
    );
    res.json({ message: "Quiz updated successfully!" });
  } catch (err) {
    console.error("🔥 Quiz Update Error:", err.message);
    res.status(500).json({ error: "Failed to update quiz" });
  }
});

// ✅ Delete a Quiz
app.delete("/quiz/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM quizzes WHERE id = $1", [id]);
    res.json({ message: "Quiz deleted successfully!" });
  } catch (err) {
    console.error("🔥 Quiz Deletion Error:", err.message);
    res.status(500).json({ error: "Failed to delete quiz" });
  }
});

/* =====================================
   🔹 QUESTIONS CRUD (Create, Read, Update, Delete) 
   ===================================== */

// ✅ Add a Question to a Quiz
app.post("/quiz/:quizId/questions", async (req, res) => {
  const { quizId } = req.params;
  const { text, options, correctOption } = req.body;

  try {
    const result = await pool.query(
      "INSERT INTO questions (quiz_id, text, options, correct_option) VALUES ($1, $2, $3, $4) RETURNING *",
      [quizId, text, JSON.stringify(options), correctOption] // ✅ Store as JSON
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("🔥 Question Creation Error:", err.message);
    res.status(500).json({ error: "Failed to add question" });
  }
});

// ✅ Get All Questions for a Quiz
app.get("/quiz/:quizId/questions", async (req, res) => {
  const { quizId } = req.params;
  try {
    const result = await pool.query("SELECT * FROM questions WHERE quiz_id = $1", [quizId]);
    res.json(result.rows);
  } catch (err) {
    console.error("🔥 Fetch Questions Error:", err.message);
    res.status(500).json({ error: "Failed to retrieve questions" });
  }
});

// ✅ Update a Question
app.put("/question/:id", async (req, res) => {
  const { id } = req.params;
  const { text, options, correctOption } = req.body;
  try {
    await pool.query(
      "UPDATE questions SET text = $1, options = $2, correct_option = $3 WHERE id = $4",
      [text, JSON.stringify(options), correctOption, id]
    );
    res.json({ message: "Question updated successfully!" });
  } catch (err) {
    console.error("🔥 Question Update Error:", err.message);
    res.status(500).json({ error: "Failed to update question" });
  }
});

// ✅ Delete a Question
app.delete("/question/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM questions WHERE id = $1", [id]);
    res.json({ message: "Question deleted successfully!" });
  } catch (err) {
    console.error("🔥 Question Deletion Error:", err.message);
    res.status(500).json({ error: "Failed to delete question" });
  }
});

/* =====================================
   🔹 START SERVER 
   ===================================== */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🔥 Server running on port ${PORT}`));
