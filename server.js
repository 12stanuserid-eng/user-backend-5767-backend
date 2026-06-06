require('dotenv').config();
  const express = require('express');
  const cors = require('cors');
  const errorHandler = require('./middleware/errorHandler');

  const authRoutes = require('./routes/auth');
  const productRoutes = require('./routes/products');
  const categoryRoutes = require('./routes/categories');
  const cartRoutes = require('./routes/cart');
  const orderRoutes = require('./routes/orders');
  const reviewRoutes = require('./routes/reviews');
  const sellerRoutes = require('./routes/sellers');
  const adminRoutes = require('./routes/admin');
  const wishlistRoutes = require('./routes/wishlist');

  const app = express();
  app.use(cors({ origin: '*' }));
  app.use(express.json());

  app.get('/health', (req, res) => res.json({ status: 'ok', app: 'ecommerce-marketplace-9570', timestamp: new Date().toISOString() }));
  app.get('/', (req, res) => res.json({ message: 'Multi-Vendor Marketplace API', version: '1.0.0', routes: ['/api/auth', '/api/products', '/api/categories', '/api/cart', '/api/orders', '/api/reviews', '/api/sellers', '/api/admin', '/api/wishlist'] }));

  app.use('/api/auth', authRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/cart', cartRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/reviews', reviewRoutes);
  app.use('/api/sellers', sellerRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/wishlist', wishlistRoutes);
  app.use(errorHandler);

  const PORT = process.env.PORT || 10000;
  app.listen(PORT, '0.0.0.0', () => console.log('Server running on port ' + PORT));
  