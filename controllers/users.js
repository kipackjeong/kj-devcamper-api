const asyncHandler = require('../middleware/async')
const User = require('../models/User')
const ErrorResponse = require('../utility/errorResponse')

//@desc GET get all the users
//@route api/v1/user
//@access private
exports.getUsers = asyncHandler(async (req, res, next) => {
  res.status(200).json({ success: true, data: res.advancedResults })
})

exports.getUser = asyncHandler(async (req, res, next) => {
  console.log(req)
  const user = await User.findById(req.params.id).select('+password')
  if (!user) {
    return next(
      new ErrorResponse(`Cannot find a user with id of ${req.params.id}`),
      404,
    )
  }
  res.status(200).json({ success: true, data: user })
})
