const db = require('../config/database');
const fs = require('fs');
const csv = require('csv-parser');

// 1. GET Products (Fetch All + Search)
exports.getProducts = (req, res) => {
  const { name, category } = req.query;
  
  let sql = `SELECT * FROM products WHERE 1=1`;
  const params = [];

  if (name) {
    sql += ` AND name LIKE ?`;
    params.push(`%${name}%`);
  }
  
  if (category) {
    sql += ` AND category = ?`;
    params.push(category);
  }

  sql += ` ORDER BY created_at DESC`;

  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
};

// 2. UPDATE Product (With History Log)
exports.updateProduct = (req, res) => {
  const { id } = req.params;
  const { name, category, brand, stock, status } = req.body;
  const newStock = parseInt(stock);

  // Get old data to compare
  db.get(`SELECT * FROM products WHERE id = ?`, [id], (err, oldProduct) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!oldProduct) return res.status(404).json({ error: 'Product not found' });

    const oldStock = oldProduct.stock;

    // Update
    const sql = `UPDATE products SET name=?, category=?, brand=?, stock=?, status=? WHERE id=?`;
    const params = [name, category, brand, newStock, status, id];

    db.run(sql, params, function(err) {
      if (err) return res.status(500).json({ error: err.message });

      // History Log
      if (oldStock !== newStock) {
        const logSql = `INSERT INTO inventory_logs (product_id, action_type, old_stock, new_stock, changed_by) VALUES (?, 'UPDATE', ?, ?, 'Admin')`;
        db.run(logSql, [id, oldStock, newStock], (logErr) => {
          if (logErr) console.error('History Log Failed:', logErr);
        });
      }

      res.json({ message: 'Product updated successfully' });
    });
  });
};

// 3. IMPORT CSV
exports.importProducts = (req, res) => {
  const results = [];
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  
  const filePath = req.file.path; 

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      let added = 0;
      let skipped = 0;

      const promises = results.map((row) => {
        return new Promise((resolve) => {
          // Check Duplicate
          db.get(`SELECT id FROM products WHERE name = ?`, [row.Name || row.name], (err, existing) => {
            if (existing) {
              skipped++;
              resolve();
            } else {
              // Insert
              const sql = `INSERT INTO products (name, unit, category, brand, stock, status, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)`;
              const params = [
                 row.Name || row.name, 
                 row.Unit || row.unit, 
                 row.Category || row.category, 
                 row.Brand || row.brand, 
                 row.Stock || row.stock, 
                 row.Status || row.status, 
                 row.Image || row.image
              ];
              
              db.run(sql, params, function (err) {
                if (!err) added++;
                resolve();
              });
            }
          });
        });
      });

      Promise.all(promises).then(() => {
        fs.unlinkSync(filePath); // Cleanup
        res.json({ message: 'Import processing complete', added, skipped });
      });
    });
};


// 6. CREATE Single Product
exports.createProduct = (req, res) => {
  const { name, unit, category, brand, stock, status, image_url } = req.body;
  
  // Default image if none provided
  const img = image_url || 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=100';

  const sql = `INSERT INTO products (name, unit, category, brand, stock, status, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  const params = [name, unit, category, brand, stock, status, img];

  db.run(sql, params, function(err) {
    if (err) {
      // Check for duplicate name error
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Product name already exists' });
      }
      return res.status(500).json({ error: err.message });
    }
    
    // Log the creation
    db.run(`INSERT INTO inventory_logs (product_id, action_type, old_stock, new_stock, changed_by) VALUES (?, 'CREATE', 0, ?, 'Admin')`, [this.lastID, stock]);

    res.json({ message: 'Product created successfully', id: this.lastID });
  });
};


// 4. DELETE Product (The Missing Piece)
exports.deleteProduct = (req, res) => {
  const { id } = req.params;
  db.run(`DELETE FROM products WHERE id = ?`, [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Product deleted successfully' });
  });
};

// 5. GET History Logs
exports.getProductHistory = (req, res) => {
  const { id } = req.params;
  const sql = `SELECT * FROM inventory_logs WHERE product_id = ? ORDER BY change_date DESC`;
  
  db.all(sql, [id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};