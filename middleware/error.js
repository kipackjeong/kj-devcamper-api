const ErrorResponse = require('../utility/errorResponse')
const colors = require('colors')

const errorHandler = (err, req, res, next) => {
  let error = { ...err }
  error.message = err.message

  // Mongoose bad ObjectId
  let message
  if (err.name === 'CastError') {
    message = `Object not found with id of ${err.value}`
    error = new ErrorResponse(message, 404)
  }
  // Mongoose duplicate key
  if (err.code === 11000) {
    message = 'Duplicate field value entered'
    error = new ErrorResponse(message, 400)
  }
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    message = Object.values(err.errors).map((val) => val.message)
    error = new ErrorResponse(message, 400)
  }
  console.log(err.name.red, err.message)

  res
    .status(error.statusCode || 500)
    .json({ success: false, error: error.message || 'Server Error' })
}

module.exports = errorHandler
