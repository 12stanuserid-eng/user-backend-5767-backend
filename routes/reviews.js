const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { reviews, products } = require('../store');
const { protect, authorize } = require('../middleware/auth');

router.get('/product/:productId', (req, res) => {
  const prodReviews = reviews.filter(r => r.productId === req.params.productId);
  res.status(200).json({ success: true, count: prodReviews.length, data: prodReviews });
});

router.post('/', protect, authorize('buyer'), (req, res) => {
  const { productId, rating, comment } = req.body;
  if (!productId || !rating || rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, error: 'Provide valid productId and rating between 1 and 5' });
  }

  const product = products.find(p => p.id === productId);
  if (!product) return res.status(404).json({ success: false, error: 'Product not found' });

  const newReview = {
    id: uuidv4(),
    productId,
    buyerId: req.user.id,
    buyerName: req.user.name,
    rating: parseInt(rating),
    comment: comment || '',
    createdAt: new Date().toISOString()
  };

  reviews.push(newReview);
  res.status(201).json({ success: true, data: newReview });
});

router.delete('/:id', protect, (req, res) => {
  const index = reviews.findIndex(r => r.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, error: 'Review not found' });

  if (req.user.role !== 'admin' && reviews[index].buyerId !== req.user.id) {
    return res.status(403).json({ success: false, error: 'Not authorized to delete this review' });
  }

  reviews.splice(index, 1);
  res.status(200).json({ success: true, data: {} });
});

module.exports = router;