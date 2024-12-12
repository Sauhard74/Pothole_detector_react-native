const express = require('express');
const { registerUser, signInUser, deleteUser, getUserHistory } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', registerUser);
router.post('/signin', signInUser);
router.delete('/delete', protect, deleteUser);
router.get('/history', protect, getUserHistory);

module.exports = router;
