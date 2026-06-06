const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { categories } = require('../store');
const { protect, authorize } = require('../middleware/auth');

router.get('/', (req, res) => {
  res.status(200).json({ success: true, count: categories.length, data: categories });
});

router.post('/', protect, authorize('admin'), (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ success: false, error: 'Category name is required' });

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const existing = categories.find(c => c.slug === slug);
  if (existing) return res.status(400).json({ success: false, error: 'Category already exists' });

  const newCategory = { id: uuidv4(), name, slug };
  categories.push(newCategory);
  res.status(201).json({ success: true, data: newCategory });
});

router.put('/:id', protect, authorize('admin'), (req, res) => {
  const category = categories.find(c => c.id === req.params.id);
  if (!category) return res.status(404).json({ success: false, error: 'Category not found' });

  if (req.body.name) {
    category.name = req.body.name;
    category.slug = req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  }
  res.status(200).json({ success: true, data: category });
});

router.delete('/:id', protect, authorize('admin'), (req, res) => {
  const index = categories.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, error: 'Category not found' });

  categories.splice(index, 1);
  res.status(200).json({ success: true, data: {} });
});

module.exports = router;