const path = require('path')
const ErrorResponse = require('../utility/errorResponse')
const Bootcamp = require('../models/Bootcamp')
const asyncHandler = require('../middleware/async')
const { getLatAndLng } = require('../utility/geocoder')
// @desc : Get all bootcamps
// @route : GET /api/v1/bootcamps
// @access : Public
exports.getBootcamps = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults)
})

// @desc : Get single bootcamps
// @route : GET /api/v1/bootcamps/:id
// @access : Public
exports.getBootcamp = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById(req.params.id)
  if (!bootcamp) {
    return next(
      new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404),
    )
  }
  res.status(200).json({ success: true, data: bootcamp })
})

// @desc : Create bootcamps
// @route : POST /api/v1/bootcamps
// @access : Private
exports.createBootcamp = asyncHandler(async (req, res, next) => {
  // Add user
  req.body.user = req.user.id

  // Check for published bootcamp
  const publishedBootcamp = await Bootcamp.find({ user: req.user.id })
  if (publishedBootcamp && req.user.role != 'admin') {
    return next(
      new ErrorResponse(
        `The current user ${req.user.name} is not an admin and already published one bootcamp`,
      ),
      400,
    )
  }
  // This will create a bootcamp model with data from request, into mongo db.
  const bootcamp = await Bootcamp.create(req.body)

  res.status(201).json({ success: true, data: bootcamp })
})

// @desc : Update bootcamps
// @route : PUT /api/v1/bootcamps/:id
// @access : Private
exports.updateBootcamp = asyncHandler(async (req, res, next) => {
  let bootcamp = await Bootcamp.findById(req.params.id)
  if (!bootcamp) {
    return next(
      new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404),
    )
  }
  // check for user if they are the owner
  if (bootcamp.user.toString() != req.user.id && req.user.role != 'admin') {
    return next(
      new ErrorResponse(
        `Current user ${req.user.name}, is not allowed to modify this bootcamp.`,
        401,
      ),
    )
  }
  bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })
  res.status(200).json({ success: true, data: bootcamp })
})

// @desc : Delete bootcamps
// @route : DELETE /api/v1/bootcamps
// @access : Private
exports.deleteBootcamp = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById(req.params.id)
  if (!bootcamp) {
    return next(
      new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404),
    )
  }
  // check for user if they are the owner
  if (bootcamp.user.toString() != req.user.id && req.user.role != 'admin') {
    return next(
      new ErrorResponse(
        `Current user ${req.user.name}, is not allowed to modify this bootcamp.`,
        401,
      ),
    )
  }
  bootcamp.remove()
  res.status(200).json({ success: true, data: {} })
})

// @desc : Get bootcamps within a radius
// @route : GET /api/v1/bootcamps/radius/:zipcode/:distance
// @access : Public
exports.getBootcampsInRadius = asyncHandler(async (req, res, next) => {
  const { zipcode, distance } = req.params

  // Get lat/lng from geocoder
  const { latitude, longitude } = await getLatAndLng(zipcode)
  // Calc radius using radians
  const radius = distance / 3963
  const bootcamps = await Bootcamp.find({
    location: {
      $geoWithin: { $centerSphere: [[longitude, latitude], radius] },
    },
  })

  res.status(200).json({
    success: true,
    count: bootcamps.length,
    data: bootcamps,
  })
})
// @desc : Upload photo for bootcamp
// @route : PUT /api/v1/bootcamps/:id/photo
// @access : Private
exports.bootcampPhotoUpload = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById(req.params.id)
  if (!bootcamp) {
    return next(
      new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404),
    )
  }
  if (!req.files) {
    return next(new ErrorResponse(`Please upload a file`, 400))
  }

  const file = req.files.file
  // make sure the image is photo
  if (!file.mimetype.startsWith('image')) {
    return next(new ErrorResponse(`Please upload an image file`, 400))
  }
  // check file size
  if (file.size > process.env.MAX_FILE_UPLOAD) {
    return next(
      new ErrorResponse(
        `Please upload an image less than ${process.env.MAX_FILE_UPLOAD}`,
        400,
      ),
    )
  }
  // check for user if they are the owner
  if (bootcamp.user.toString() != req.user.id && req.user.role != 'admin') {
    return next(
      new ErrorResponse(
        `Current user ${req.user.name}, is not allowed to modify this bootcamp.`,
        401,
      ),
    )
  }
  // create custom filename
  file.name = `photo_${bootcamp._id}${path.parse(file.name).ext}`
  file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async (error) => {
    if (error) {
      console.log(error)
      return next(new ErrorResponse(`Problem with file upload`, 400))
    }
    await Bootcamp.findByIdAndUpdate(req.params.id, { photo: file.name })
    res.status(200).json({ success: true, data: file.name })
  })
})
