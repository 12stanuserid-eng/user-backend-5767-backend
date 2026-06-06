const express = require('express');
const router = express.Router();
const { products, orders } = require('../store');
const { protect, authorize } = require('../middleware/auth');

router.get('/dashboard', protect, authorize('seller'), (req, res) => {
  const myProducts = products.filter(p => p.sellerId === req.user.id);
  const myOrders = orders.filter(o => o.items.some(item => item.sellerId === req.user.id));

  let totalEarnings = 0;
  let totalItemsSold = 0;

  myOrders.forEach(order => {
    if (order.status !== 'Cancelled') {
      order.items.forEach(item => {
        if (item.sellerId === req.user.id) {
          totalEarnings += item.price * item.quantity;
          totalItemsSold += item.quantity;
        }
      });
    }
  });

  res.status(200).json({
    success: true,
    data: {
      earnings: totalEarnings,
      itemsSold: totalItemsSold,
      productCount: myProducts.length,
      orderCount: myOrders.length,
      products: myProducts
    }
  });
});

module.exports = router;