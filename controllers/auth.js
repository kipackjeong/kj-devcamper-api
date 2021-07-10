const ErrorResponse = require('../utility/errorResponse')
const User = require('../models/User')
const asyncHandler = require('../middleware/asyncHandler')
// @desc : Register user
// @route : POST /api/v1/auth/register
// @access : Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body

  // Create user
  const user = await User.create({ name, email, password, role })

  // Create token
  const token = user.getSignedJwtToken()
  res.status(200).json({ success: true, data: user, token: token })
})

// @desc : Login user
// @route : POST /api/v1/auth/login
// @access : Public
exports.login = asyncHandler(async (req, res, next) => {
  // check if email and password exists in request
  const { name, email, password, role } = req.body
  if (!email || !password) {
    return next(new ErrorResponse('Invalid credentials'), 401)
  }

  // check if user exists in our database
  const user = await User.findOne({ email }).select('+password')
  console.log(user)
  if (!user) {
    return next(new ErrorResponse(`Invalid credentials`, 401))
  }

  // check if password matches
  const isMatch = await user.matchPassword(password)
  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401))
  }

  res.status(200).json({ success: true, data: user })
})
