const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load Config
dotenv.config();
const db = require('./config/database');

// Import Routes
const productRoutes = require('./routes/productRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/products', productRoutes);

// Basic Test Route
app.get('/', (req, res) => {
  res.send('Inventory Management API is Running...');
});

// Start Server (This is the part that was likely missing!)
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});