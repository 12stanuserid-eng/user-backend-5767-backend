const express = require('express');
const router = express.Router();
const { wishlists, products } = require('../store');
const { protect, authorize } = require('../middleware/auth');

const initWishlist = (userId) => {
  if (!wishlists[userId]) wishlists[userId] = [];
  return wishlists[userId];
};

router.get('/', protect, authorize('buyer'), (req, res) => {
  const list = initWishlist(req.user.id);
  const detailedList = list.map(id => products.find(p => p.id === id)).filter(Boolean);
  res.status(200).json({ success: true, data: detailedList });
});

router.post('/', protect, authorize('buyer'), (req, res) => {
  const { productId } = req.body;
  if (!productId) return res.status(400).json({ success: false, error: 'ProductId required' });

  const product = products.find(p => p.id === productId);
  if (!product) return res.status(404).json({ success: false, error: 'Product not found' });

  const list = initWishlist(req.user.id);
  if (!list.includes(productId)) {
    list.push(productId);
  }
  res.status(200).json({ success: true, data: list });
});

router.delete('/:productId', protect, authorize('buyer'), (req, res) => {
  const list = initWishlist(req.user.id);
  const index = list.indexOf(req.params.productId);
  if (index === -1) return res.status(404).json({ success: false, error: 'Product not in wishlist' });

  list.splice(index, 1);
  res.status(200).json({ success: true, data: list });
});

module.exports = router;