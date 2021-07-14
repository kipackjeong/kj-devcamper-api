const ErrorResponse = require('../utility/errorResponse')
const User = require('../models/User')
const asyncHandler = require('../middleware/async')

// @desc : Register user
// @route : POST /api/v1/auth/register
// @access : Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body

  // Create user
  const user = await User.create({ name, email, password, role })

  // Create token
  const token = user.getSignedJwtToken()

  res.status(200).json({ success: true, data: user, token })
  req.cookies
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
  if (!user) {
    return next(new ErrorResponse(`Invalid credentials`, 401))
  }

  // check if password matches
  const isMatch = await user.matchPassword(password)
  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401))
  }
  sendTokenResponse(user, 200, res)
})

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken()

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
  }

  if (process.env.NODE_ENV == 'production') {
    options.secure = true
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({ success: true, token: token })
}
// @desc : Get currnet logged in user
// @route : POST /api/v1/auth/me
// @access : Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id)

  res.status(200).json({ success: true, data: user })
})

// @desc : Forgot password functionality
// @route : POST /api/v1/auth/forgotpw
// @access : Private
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  // find user by email from req.body
  const user = await User.findOne({ email: req.body.email })

  if (!user) {
    return next(new ErrorResponse(`There is no user with that email`, 404))
  }
})
