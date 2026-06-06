const express = require('express');
const router = express.Router();
const { carts, products } = require('../store');
const { protect, authorize } = require('../middleware/auth');

const initCart = (userId) => {
  if (!carts[userId]) carts[userId] = { items: [] };
  return carts[userId];
};

router.get('/', protect, authorize('buyer'), (req, res) => {
  const cart = initCart(req.user.id);
  res.status(200).json({ success: true, data: cart });
});

router.post('/items', protect, authorize('buyer'), (req, res) => {
  const { productId, quantity } = req.body;
  if (!productId || !quantity || quantity <= 0) {
    return res.status(400).json({ success: false, error: 'Valid productId and positive quantity required' });
  }

  const product = products.find(p => p.id === productId);
  if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
  if (product.inventory < quantity) return res.status(400).json({ success: false, error: 'Insufficient product inventory' });

  const cart = initCart(req.user.id);
  const itemIndex = cart.items.findIndex(item => item.productId === productId);

  if (itemIndex > -1) {
    if (product.inventory < cart.items[itemIndex].quantity + quantity) {
      return res.status(400).json({ success: false, error: 'Cannot exceed available product inventory' });
    }
    cart.items[itemIndex].quantity += parseInt(quantity);
  } else {
    cart.items.push({
      productId,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      sellerId: product.sellerId,
      quantity: parseInt(quantity)
    });
  }

  res.status(200).json({ success: true, data: cart });
});

router.put('/items/:productId', protect, authorize('buyer'), (req, res) => {
  const { quantity } = req.body;
  if (quantity === undefined || quantity < 0) return res.status(400).json({ success: false, error: 'Valid quantity required' });

  const cart = initCart(req.user.id);
  const itemIndex = cart.items.findIndex(item => item.productId === req.params.productId);
  if (itemIndex === -1) return res.status(404).json({ success: false, error: 'Item not found in cart' });

  if (quantity === 0) {
    cart.items.splice(itemIndex, 1);
  } else {
    const product = products.find(p => p.id === req.params.productId);
    if (!product || product.inventory < quantity) {
      return res.status(400).json({ success: false, error: 'Requested quantity exceeds product inventory' });
    }
    cart.items[itemIndex].quantity = parseInt(quantity);
  }

  res.status(200).json({ success: true, data: cart });
});

router.delete('/items/:productId', protect, authorize('buyer'), (req, res) => {
  const cart = initCart(req.user.id);
  const itemIndex = cart.items.findIndex(item => item.productId === req.params.productId);
  if (itemIndex === -1) return res.status(404).json({ success: false, error: 'Item not found in cart' });

  cart.items.splice(itemIndex, 1);
  res.status(200).json({ success: true, data: cart });
});

module.exports = router;