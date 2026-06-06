const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { products, categories } = require('../store');
const { protect, authorize } = require('../middleware/auth');

router.get('/', (req, res) => {
  let result = [...products];
  const { search, category, minPrice, maxPrice, sellerId } = req.query;

  if (search) {
    result = result.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase()));
  }
  if (category) {
    result = result.filter(p => p.category.toLowerCase() === category.toLowerCase() || p.categoryId === category);
  }
  if (minPrice) {
    result = result.filter(p => p.price >= parseFloat(minPrice));
  }
  if (maxPrice) {
    result = result.filter(p => p.price <= parseFloat(maxPrice));
  }
  if (sellerId) {
    result = result.filter(p => p.sellerId === sellerId);
  }

  res.status(200).json({ success: true, count: result.length, data: result });
});

router.get('/:id', (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
  res.status(200).json({ success: true, data: product });
});

router.post('/', protect, authorize('seller', 'admin'), (req, res) => {
  const { name, description, price, imageUrl, categoryId, inventory } = req.body;
  if (!name || !price || !categoryId || inventory === undefined) {
    return res.status(400).json({ success: false, error: 'Provide name, price, categoryId, and inventory' });
  }

  const category = categories.find(c => c.id === categoryId);
  if (!category) return res.status(404).json({ success: false, error: 'Category not found' });

  const newProduct = {
    id: uuidv4(),
    name,
    description: description || '',
    price: parseFloat(price),
    imageUrl: imageUrl || '[https://via.placeholder.com/150](https://via.placeholder.com/150)',
    categoryId,
    category: category.name,
    inventory: parseInt(inventory),
    sellerId: req.user.id,
    createdAt: new Date().toISOString()
  };

  products.push(newProduct);
  res.status(201).json({ success: true, data: newProduct });
});

router.put('/:id', protect, authorize('seller', 'admin'), (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ success: false, error: 'Product not found' });

  if (req.user.role !== 'admin' && product.sellerId !== req.user.id) {
    return res.status(403).json({ success: false, error: 'Not authorized to manage this product' });
  }

  const fields = ['name', 'description', 'price', 'imageUrl', 'inventory'];
  fields.forEach(field => {
    if (req.body[field] !== undefined) {
      product[field] = field === 'price' ? parseFloat(req.body[field]) : field === 'inventory' ? parseInt(req.body[field]) : req.body[field];
    }
  });

  if (req.body.categoryId) {
    const category = categories.find(c => c.id === req.body.categoryId);
    if (!category) return res.status(404).json({ success: false, error: 'Category not found' });
    product.categoryId = req.body.categoryId;
    product.category = category.name;
  }

  res.status(200).json({ success: true, data: product });
});

router.delete('/:id', protect, authorize('seller', 'admin'), (req, res) => {
  const index = products.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, error: 'Product not found' });

  if (req.user.role !== 'admin' && products[index].sellerId !== req.user.id) {
    return res.status(403).json({ success: false, error: 'Not authorized to manage this product' });
  }

  products.splice(index, 1);
  res.status(200).json({ success: true, data: {} });
});

module.exports = router;