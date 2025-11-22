const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// CORRECT PATH for Render (Looking inside the same 'backend' folder)
const dbPath = path.resolve(__dirname, '../inventory.db'); 

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// Initialize Tables
db.serialize(() => {
  // 1. Products Table
  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    unit TEXT,
    category TEXT,
    brand TEXT,
    stock INTEGER NOT NULL DEFAULT 0,
    status TEXT,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // 2. Inventory Logs Table
  db.run(`CREATE TABLE IF NOT EXISTS inventory_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    action_type TEXT, 
    old_stock INTEGER,
    new_stock INTEGER,
    changed_by TEXT DEFAULT 'Admin', 
    change_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(product_id) REFERENCES products(id)
  )`);
  
  // 3. Users Table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password_hash TEXT
  )`);
});

// CRITICAL LINE: This exports the 'db' object so controllers can use it
module.exports = db;