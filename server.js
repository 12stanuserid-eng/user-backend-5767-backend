require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 10000;
const JWT_SECRET = process.env.JWT_SECRET || 'pipeline-secret-key';

app.use(cors({ origin: '*' }));
app.use(express.json());

const users = [];
const tasks = [];
let uid = 1, tid = 1;

const auth = (req, res, next) => {
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch(e) { res.status(401).json({ error: 'Invalid token' }); }
};

app.get('/health', (req, res) => res.json({ status: 'ok', app: 'build-a-simple-9058' }));
app.get('/', (req, res) => res.json({ message: 'Task Manager API', version: '1.0.0' }));

app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  if (users.find(u => u.email === email)) return res.status(409).json({ error: 'Email exists' });
  const hashed = await bcrypt.hash(password, 10);
  const user = { id: uid++, email, password: hashed };
  users.push(user);
  const token = jwt.sign({ id: user.id, email }, JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({ token, user: { id: user.id, email } });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);
  if (!user || !await bcrypt.compare(password, user.password)) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, email } });
});

app.get('/api/tasks', auth, (req, res) => {
  res.json({ tasks: tasks.filter(t => t.user_id === req.user.id) });
});

app.post('/api/tasks', auth, (req, res) => {
  const { title, description, due_date, priority = 'medium' } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  const task = { id: tid++, user_id: req.user.id, title, description: description || '', due_date: due_date || null, priority, completed: false, created_at: new Date().toISOString() };
  tasks.push(task);
  res.status(201).json(task);
});

app.put('/api/tasks/:id', auth, (req, res) => {
  const task = tasks.find(t => t.id === parseInt(req.params.id) && t.user_id === req.user.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  Object.assign(task, req.body, { id: task.id, user_id: task.user_id });
  res.json(task);
});

app.delete('/api/tasks/:id', auth, (req, res) => {
  const idx = tasks.findIndex(t => t.id === parseInt(req.params.id) && t.user_id === req.user.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  tasks.splice(idx, 1);
  res.json({ message: 'Deleted' });
});

app.listen(PORT, '0.0.0.0', () => console.log('Server running on port ' + PORT));