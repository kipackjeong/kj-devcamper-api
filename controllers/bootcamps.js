const ErrorResponse = require('../utility/errorResponse')
const Bootcamp = require('../models/Bootcamp')
const errorHandler = require('../middleware/errorHandler')
const asyncHandler = require('../middleware/asyncHandler')
const { getLatAndLng } = require('../utility/geocoder')
const Course = require('../models/Course')
const reversePopulate = require('mongoose-reverse-populate-v2')
// @desc : Get all bootcamps
// @route : GET /api/v1/bootcamps
// @access : Public
exports.getBootcamps = asyncHandler(async (req, res, next) => {
  let query

  // Copy req.query
  const reqQuery = { ...req.query }
  // Fields to exclude
  const removeFields = ['select', 'sort', 'page', 'limit']

  // Loop over removeFields and delete them from reqQuery
  removeFields.forEach((param) => delete reqQuery[param])
  // Create query string
  let queryStr = JSON.stringify(reqQuery)

  // Create operators ($gt,$gte,$lt,$lte,$in)
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, (match) => `$${match}`)
  query = Bootcamp.find(JSON.parse(queryStr))

  // Select Fields ex) &select=description,name
  if (req.query.select) {
    let selectedFields = req.query.select.split(',').join(' ')
    query.select(selectedFields)
  }

  // Sort  ex) &sort=-name
  if (req.query.sort) {
    let sortOptions = req.query.sort.split(',').join(' ')
    query.sort(sortOptions)
  } else {
    query.sort('-createdAt')
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1
  const limit = parseInt(req.query.limit, 10) || 10
  const startIndex = (page - 1) * limit
  const endIndex = page * limit
  const total = await Bootcamp.countDocuments()

  query.skip(startIndex).limit(limit)

  // Pagination result
  const pagination = {}
  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit,
    }
  }
  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit,
    }
  }

  // Executing query
  const bootcamps = await query.populate({
    path: 'courses',
    select: 'title description tuition weeks',
  })

  res.status(200).json({
    success: true,
    count: bootcamps.length,
    data: bootcamps,
    pagination,
  })
})

// @desc : Get single bootcampsx`
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
  // This will create a bootcamp model with data from request, into mongo db.
  const bootcamp = await Bootcamp.create(req.body)

  res.status(201).json({ success: true, data: bootcamp })
})

// @desc : Update bootcamps
// @route : PUT /api/v1/bootcamps/:id
// @access : Private
exports.updateBootcamp = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })
  if (!bootcamp) {
    return next(
      new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404),
    )
  }
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
