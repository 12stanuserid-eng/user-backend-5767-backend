const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { orders, carts, products } = require('../store');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('buyer'), (req, res) => {
  const cart = carts[req.user.id];
  if (!cart || cart.items.length === 0) {
    return res.status(400).json({ success: false, error: 'Your cart is empty' });
  }
  const { shippingAddress } = req.body;
  if (!shippingAddress) return res.status(400).json({ success: false, error: 'Shipping address is required' });

  let total = 0;
  for (const item of cart.items) {
    const product = products.find(p => p.id === item.productId);
    if (!product || product.inventory < item.quantity) {
      return res.status(400).json({ success: false, error: `Product ${item.name} is unavailable in requested quantity` });
    }
  }

  const orderItems = cart.items.map(item => {
    const product = products.find(p => p.id === item.productId);
    product.inventory -= item.quantity;
    total += item.price * item.quantity;
    return { ...item };
  });

  const newOrder = {
    id: uuidv4(),
    buyerId: req.user.id,
    items: orderItems,
    total,
    shippingAddress,
    status: 'Pending',
    createdAt: new Date().toISOString()
  };

  orders.push(newOrder);
  carts[req.user.id].items = [];

  res.status(201).json({ success: true, data: newOrder });
});

router.get('/', protect, (req, res) => {
  let userOrders = [];
  if (req.user.role === 'buyer') {
    userOrders = orders.filter(o => o.buyerId === req.user.id);
  } else if (req.user.role === 'seller') {
    userOrders = orders.filter(o => o.items.some(item => item.sellerId === req.user.id));
  } else if (req.user.role === 'admin') {
    userOrders = orders;
  }
  res.status(200).json({ success: true, count: userOrders.length, data: userOrders });
});

router.get('/:id', protect, (req, res) => {
  const order = orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

  if (req.user.role === 'buyer' && order.buyerId !== req.user.id) {
    return res.status(403).json({ success: false, error: 'Not authorized' });
  }
  if (req.user.role === 'seller' && !order.items.some(i => i.sellerId === req.user.id)) {
    return res.status(403).json({ success: false, error: 'Not authorized' });
  }

  res.status(200).json({ success: true, data: order });
});

router.put('/:id/status', protect, authorize('seller', 'admin'), (req, res) => {
  const { status } = req.body;
  if (!status || !['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid order status' });
  }

  const order = orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

  if (req.user.role === 'seller' && !order.items.some(i => i.sellerId === req.user.id)) {
    return res.status(403).json({ success: false, error: 'Not authorized to change status of this order' });
  }

  order.status = status;
  res.status(200).json({ success: true, data: order });
});

module.exports = router;