const ErrorResponse = require(`../utility/errorResponse`)
const Course = require(`../models/Course`)
const Bootcamp = require('../models/Bootcamp')
const asyncHandler = require('../middleware/asyncHandler')

// @desc: Get all courses
// @route: Get /api/v1/courses
// @route: Get /api/v1/bootcamps/:bootcampId/courses
// @access: public
exports.getCourses = asyncHandler(async (req, res, next) => {
  if (req.params.bootcampId) {
    const courses = await Course.find({ bootcamp: req.params.bootcampId })
    return res
      .status(200)
      .json({ success: true, count: courses.length, data: courses })
  } else {
    res.status(200).json(res.advancedResults)
  }
})

// @desc: Get single course by id
// @route: Get /api/v1/courses/:id
// @access: public
exports.getCourse = asyncHandler(async (req, res, next) => {
  let query
  query = Course.findById(req.params.id).populate({
    path: 'bootcamp',
    select: 'name description',
  })
  const course = await query

  if (!course) {
    return next(
      new ErrorResponse(`Course not found with id of ${req.params.id}`, 404),
    )
  }

  res.status(200).json({
    success: true,
    data: course,
  })
})
// @desc: Create course
// @route: Post /api/v1/bootcamps/:bootcampId/courses
// @access: Private
exports.createCourse = asyncHandler(async (req, res, next) => {
  console.log('create course'.red)

  req.body.bootcamp = req.params.bootcampId
  const bootcamp = await Bootcamp.findById(req.params.bootcampId)
  if (!bootcamp) {
    return next(
      new ErrorResponse(
        `No bootcamp with the id of ${req.params.bootcampId}`,
        404,
      ),
    )
  }
  const course = await Course.create(req.body)
  res.status(201).json({
    success: true,
    data: course,
  })
})

// @desc: Put single course
// @route: Put /api/v1/courses/:id
// @access: Private
exports.updateCourse = asyncHandler(async (req, res, next) => {
  console.log('update course'.red)
  const updatedCourse = await Course.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true },
  )
  if (!updatedCourse) {
    return next(
      new ErrorResponse(`Course not found with id of ${req.params.id}`, 404),
    )
  }
  res.status(200).json({
    success: true,
    data: updatedCourse,
  })
})

// @desc: Delete single course
// @route: Delete /api/v1/courses:id
// @access: Private
exports.deleteCourse = asyncHandler(async (req, res, next) => {
  console.log('delete course'.red)
  const courseToDelete = await Course.findByIdAndDelete(req.params.id)
  if (!courseToDelete) {
    return next(
      new ErrorResponse(`Course not found with id of ${req.params.id}`, 404),
    )
  }
  res.status(200).json({
    success: true,
    data: courseToDelete,
  })
})
