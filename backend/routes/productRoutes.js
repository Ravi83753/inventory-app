const express = require('express');
const router = express.Router();
const multer = require('multer');
const productController = require('../controllers/productController');

const upload = multer({ dest: 'uploads/' });

router.get('/', productController.getProducts);
router.post('/', productController.createProduct);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

// CSV Routes
router.post('/import', upload.single('csvFile'), productController.importProducts);
router.get('/export', productController.exportProducts); // Added this line!
router.get('/:id/history', productController.getProductHistory);

module.exports = router;