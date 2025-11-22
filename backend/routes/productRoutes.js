const express = require('express');
const router = express.Router();
const multer = require('multer');
const productController = require('../controllers/productController');

// Configure Multer (Temp storage for CSVs)
const upload = multer({ dest: 'uploads/' });

// API Endpoints
router.get('/', productController.getProducts);
router.put('/:id', productController.updateProduct);

// The Import Route (Accepts file with key 'csvFile')
router.post('/import', upload.single('csvFile'), productController.importProducts);

// Add this line with your other routes
router.delete('/:id', productController.deleteProduct);

router.get('/:id/history', productController.getProductHistory);

router.post('/', productController.createProduct);


module.exports = router;