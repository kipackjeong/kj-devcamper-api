const ErrorResponse = require('../utility/errorResponse')
const User = require('../models/User')
const asyncHandler = require('../middleware/async')
const sendEmail = require('../utility/sendEmail')
const crypto = require('crypto')

// @desc : Register user
// @route : POST /api/v1/auth/register
// @access : Public `
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

// @desc : logout current logged in user
// @route : GET /api/v1/auth/logout
// @access : Private
exports.logout = asyncHandler(async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  })

  res.status(200).json({ success: true, data: {} })
})

// @desc : Get currnet logged in user
// @route : POST /api/v1/auth/me
// @access : Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id)

  res.status(200).json({ success: true, data: user })
})

// @desc : Forgot password functionality
// @route : POST /api/v1/auth/forgotpassword
// @access : Private
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  // find user by email from req.body
  const user = await User.findOne({ email: req.body.email })

  if (!user) {
    return next(new ErrorResponse(`There is no user with that email`, 404))
  }
  // get reset token
  const resetToken = user.getResetPasswordToken()
  await user.save({ validateBeforeSave: false })

  const resetURL = `${req.protocol}://${req.get(
    'host',
  )}/api/v1/auth/resetpassword/${resetToken}`

  const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetURL}`
  try {
    await sendEmail({
      name: user.name,
      email: user.email,
      subject: 'Password reset token',
      message,
    })

    res.status(200).json({ success: true, data: 'Email sent' })
  } catch (error) {
    console.log(error)
    // if somehow there was a error in sending email, disregard the token
    user.resetPasswordToken = undefined
    user.resetPasswordExpire = undefined
    await user.save({ validateBeforeSave: false })
    return next(new ErrorResponse('Email could not be sent', 500))
  }
})

// @desc : Forgot password functionality
// @route : PUT /api/v1/auth/resetPassword/:resettoken
// @access : public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  // Get hashed token
  const resetPasswordTokenHashed = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex')
  // find user with this resetPasswordToken (hashed)
  const user = await User.findOne({
    resetPasswordToken: resetPasswordTokenHashed,
    resetPasswordExpire: { $gt: Date.now() },
  })
  if (!user) {
    return next(new ErrorResponse('Invalid token', 400))
  }
  // Set new password
  user.password = req.body.password
  // delete resetPassword fields
  user.resetPasswordToken = undefined
  user.resetPasswordExpire = undefined
  await user.save()
  res.status(200).json({ success: true, data: 'password changed' })
})

// @desc :Update user details
// @route : PUT /api/v1/auth/updatedetails
// @access : Private
exports.updateDetails = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email,
  }
  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  })

  res.status(200).json({ success: true, data: user })
})

// @desc :Update password
// @route : PUT /api/v1/auth/updatepassword
// @access : Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password')

  if (await user.matchPassword(req.body.currentPassword)) {
    return next(new ErrorResponse('Password is incorrect', 401))
  }

  user.password = req.body.newPassword
  await user.save()
  const token = user.getSignedJwtToken()

  sendTokenResponse(user, 200, res)
})
