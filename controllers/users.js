const asyncHandler = require('../middleware/async')
const User = require('../models/User')
const ErrorResponse = require('../utility/errorResponse')

//@desc get all users
//@route GET api/v1/users/
//@access private/Admin
exports.getUsers = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults)
})

//@desc  get single user
//@route GET api/v1/users/:id
//@access private/Admin
exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id)
  res.status(200).json({ success: true, data: user || 'no user found' })
})

//@desc  create user
//@route POST api/v1/users/
//@access private/Admin
exports.createUser = asyncHandler(async (req, res, next) => {
  const user = await User.create(req.body)
  res.status(201).json({ success: true, data: user })
})

//@desc update user
//@route PUT api/v1/users/:id
//@access private/Admin
exports.updateUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })
  res.status(200).json({ success: true, data: user })
})

//@desc Delete user
//@route DELETEapi/v1/users/:id
//@access private/Admin
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id)
  res.status(200).json({ success: true, data: user })
})
