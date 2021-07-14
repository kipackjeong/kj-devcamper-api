const express = require('express')
const router = express.Router()
const User = require('../models/User')
const { protect, authorize } = require('../middleware/auth')
const { getUsers, getUser } = require('../controllers/users')
const advancedResults = require('../middleware/advancedResults')

router.route('/').get(advancedResults(User, ''), getUsers)
router.route('/:id').get(protect, getUser)

module.exports = router
