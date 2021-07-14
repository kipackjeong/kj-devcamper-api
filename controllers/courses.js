const ErrorResponse = require(`../utility/errorResponse`)
const Course = require(`../models/Course`)
const Bootcamp = require('../models/Bootcamp')
const asyncHandler = require('../middleware/async')

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
  console.log('create course'.red.bgYellow)

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
  // Check if user is allowed to create course for this bootcamp
  if (bootcamp.user.toString() != req.user.id && req.user.role != 'admin') {
    return next(
      new ErrorResponse(
        `The user ${req.user.name} is not allowed to add course for this bootcamp ${bootcamp.name}`,
        401,
      ),
    )
  }

  req.body.user = req.user.id

  const course = await Course.create(req.body)

  console.log(
    `The course with id: ${course._id} is created successfully`.red.bgYellow,
  )
  res.status(201).json({
    success: true,
    data: course,
  })
})

// @desc: Put single course
// @route: Put /api/v1/courses/:id
// @access: Private
exports.updateCourse = asyncHandler(async (req, res, next) => {
  console.log('Update course'.red.bgYellow)
  let courseToUpdate = await Course.findById(req.params.id)
  if (!courseToUpdate) {
    return next(
      new ErrorResponse(`Course not found with id of ${req.params.id}`, 404),
    )
  }
  if (courseToUpdate.user.toString() != req.user.id) {
    return next(
      new ErrorResponse(
        `The user ${req.user.name} is not allowed to update this course ${courseToUpdate.title}`,
        401,
      ),
    )
  }

  courseToUpdate = await Course.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })
  console.log(
    `The course with id: ${courseToUpdate._id} is updated successfully`.red
      .bgYellow,
  )
  res.status(200).json({
    success: true,
    data: courseToUpdate,
  })
})

// @desc: Delete single course
// @route: Delete /api/v1/courses:id
// @access: Private
exports.deleteCourse = asyncHandler(async (req, res, next) => {
  console.log('Delete course'.red.bgYellow)
  let courseToDelete = await Course.findById(req.params.id)

  // Check if course exists
  if (!courseToDelete) {
    return next(
      new ErrorResponse(`Course not found with id of ${req.params.id}`, 404),
    )
  }
  // Check if user is allowed
  if (
    courseToDelete.user.toString() != req.user.id &&
    req.user.role != 'admin'
  ) {
    return next(
      new ErrorResponse(
        `The user ${req.user.name} is not allowed to delete this course ${courseToDelete.title}`,
        403,
      ),
    )
  }

  courseToDelete = await Course.findByIdAndDelete(req.params.id)
  console.log(
    `The course with id: ${courseToDelete._id} is deleted successfully.`.red
      .bgYellow,
  )
  res.status(200).json({
    success: true,
    data: courseToDelete,
  })
})
