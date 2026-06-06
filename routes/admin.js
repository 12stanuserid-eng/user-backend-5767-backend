const express = require('express');
const router = express.Router();
const { users, products, orders } = require('../store');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

router.get('/stats', (req, res) => {
  const totalRevenue = orders
    .filter(o => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  res.status(200).json({
    success: true,
    data: {
      usersCount: users.length,
      productsCount: products.length,
      ordersCount: orders.length,
      totalRevenue
    }
  });
});

router.get('/users', (req, res) => {
  const safeUsers = users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt }));
  res.status(200).json({ success: true, data: safeUsers });
});

router.delete('/users/:id', (req, res) => {
  const index = users.findIndex(u => u.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, error: 'User not found' });
  users.splice(index, 1);
  res.status(200).json({ success: true, data: {} });
});

module.exports = router;