const express = require('express');
const multer = require('multer');
const { reportPothole } = require('../controllers/potholeController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024 
  },
  
});

router.post('/report', protect, upload.single('image'), reportPothole);

module.exports = router;
