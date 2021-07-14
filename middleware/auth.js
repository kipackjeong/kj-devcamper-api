const cookieParser = require('cookie-parser')
const asyncHandler = require('../middleware/async')
const ErrorResponse = require('../utility/errorResponse')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
exports.protect = asyncHandler(async (req, res, next) => {
  let token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1]
  } else if (req.cookies.token) {
    token = req.cookies.token
  }

  if (!token) {
    return next(new ErrorResponse('Not authorized to access this route', 401))
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = await User.findById(decoded.id)
    next()
  } catch (error) {
    return next(new ErrorResponse('Not authorized to access this route', 401))
  }
})
exports.authorize = (...roles) => async (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(
      new ErrorResponse(
        `User role ${req.user.role} is not authorized to access this route`,
        403, // forbidden 
      ),
    )
  }
  next()
}
