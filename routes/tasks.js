const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const auth = require('../middleware/auth');

const dbPath = path.resolve(__dirname, '../db/database.sqlite');
const db = new sqlite3.Database(dbPath);

router.use(auth);

router.get('/', (req, res) => {
  const query = `SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC`;
  db.all(query, [req.user.id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error fetching tasks.' });
    }
    return res.status(200).json(rows);
  });
});

router.post('/', (req, res) => {
  const { title, description, priority, due_date } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Task title is required.' });
  }

  const taskPriority = priority || 'medium';
  const taskDueDate = due_date || null;

  const query = `INSERT INTO tasks (user_id, title, description, priority, due_date) VALUES (?, ?, ?, ?, ?)`;
  db.run(query, [req.user.id, title, description, taskPriority, taskDueDate], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Database error creating task.' });
    }
    return res.status(201).json({
      id: this.lastID,
      user_id: req.user.id,
      title,
      description,
      priority: taskPriority,
      due_date: taskDueDate,
      completed: 0
    });
  });
});

router.put('/:id', (req, res) => {
  const { title, description, priority, due_date, completed } = req.body;
  const taskId = req.params.id;

  const checkQuery = `SELECT * FROM tasks WHERE id = ? AND user_id = ?`;
  db.get(checkQuery, [taskId, req.user.id], (err, task) => {
    if (err) {
      return res.status(500).json({ error: 'Database error verifying task ownership.' });
    }
    if (!task) {
      return res.status(404).json({ error: 'Task not found or unauthorized.' });
    }

    const updatedTitle = title !== undefined ? title : task.title;
    const updatedDescription = description !== undefined ? description : task.description;
    const updatedPriority = priority !== undefined ? priority : task.priority;
    const updatedDueDate = due_date !== undefined ? due_date : task.due_date;
    const updatedCompleted = completed !== undefined ? (completed ? 1 : 0) : task.completed;

    const updateQuery = `
      UPDATE tasks 
      SET title = ?, description = ?, priority = ?, due_date = ?, completed = ? 
      WHERE id = ? AND user_id = ?
    `;

    db.run(updateQuery, [updatedTitle, updatedDescription, updatedPriority, updatedDueDate, updatedCompleted, taskId, req.user.id], function (err) {
      if (err) {
        return res.status(500).json({ error: 'Database error updating task.' });
      }
      return res.status(200).json({
        id: parseInt(taskId),
        user_id: req.user.id,
        title: updatedTitle,
        description: updatedDescription,
        priority: updatedPriority,
        due_date: updatedDueDate,
        completed: updatedCompleted
      });
    });
  });
});

router.delete('/:id', (req, res) => {
  const taskId = req.params.id;

  const query = `DELETE FROM tasks WHERE id = ? AND user_id = ?`;
  db.run(query, [taskId, req.user.id], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Database error deleting task.' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Task not found or unauthorized.' });
    }
    return res.status(200).json({ message: 'Task deleted successfully.' });
  });
});

module.exports = router;