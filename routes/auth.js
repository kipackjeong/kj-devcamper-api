const express = require('express')
const {
  register,
  login,
  getMe,
  forgotPassword,
} = require('../controllers/auth')
const { protect, authorize } = require('../middleware/auth')
const router = express.Router()
router.route('/register').post(register)
router.route('/login').post(login)
router.route('/me').get(protect, getMe)
router.route('/forgotpassword').post(forgotPassword)
module.exports = router
