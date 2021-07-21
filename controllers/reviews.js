const ErrorResponse = require(`../utility/errorResponse`)
const asyncHandler = require('../middleware/async')
const Review = require(`../models/Review`)
const Bootcamp = require('../models/Bootcamp')

// @desc: Get all reviews
// @route: Get /api/v1/reviews
// @route: Get /api/v1/bootcamps/:bootcampId/reviews
// @access: public
exports.getReviews = asyncHandler(async (req, res, next) => {
  console.log('Get all reviews...'.red.bgYellow)
  if (req.params.bootcampId) {
    const reviews = await Review.find({ bootcamp: req.params.bootcampId })
    res
      .status(200)
      .json({ success: true, count: reviews.length, data: reviews })
  } else {
    res.status(200).json(res.advancedResults)
  }
  console.log('Get all reviews completed'.red.bgYellow)
})

// @desc: Get single review
// @route: Get /api/v1/reviews/:id
// @access: public
exports.getReview = asyncHandler(async (req, res, next) => {
  console.log('Get single review...'.red.bgYellow)
  const review = await Review.findById(req.params.id).populate({
    path: 'bootcamp',
    select: 'name description',
  })
  if (!review) {
    return next(
      new ErrorResponse(`No review found with the id of ${req.params.id}`, 404),
    )
  }
  console.log('Get single review completed'.red.bgYellow)
  res.status(200).json({ success: true, data: review })
})

// @desc: Create review
// @route: POST /api/v1/bootcamps/:bootcampId/reviews
// @access: private
exports.createReview = asyncHandler(async (req, res, next) => {
  console.log('Create Review'.red.bgYellow)
  req.body.bootcamp = req.params.bootcampId
  req.body.user = req.user._id

  const bootcamp = await Bootcamp.findById(req.params.bootcampId)
  if (!bootcamp) {
    return next(
      new ErrorResponse(
        `Bootcamp not found with id of ${req.params.bootcampId}`,
        404,
      ),
    )
  }

  const reviewCreated = await Review.create(req.body)
  console.log(reviewCreated)

  res.status(200).json({ success: true, data: reviewCreated })
})

// @desc: Create review
// @route: PUT /api/v1/reviews/:id
// @access: private
exports.updateReview = asyncHandler(async (req, res, next) => {
  console.log('Update Review'.red.bgYellow)
  let review = await Review.findById(req.params.id)
  if (!review) {
    return next(
      new ErrorResponse(`Cannot find review with id ${req.params.id}`, 404),
    )
  }
  if (review.user.toString() != req.user.id && req.user.role != 'admin') {
    return next(
      new ErrorResponse(
        `The user ${req.user.name} is not allowed to edit this review`,
        401,
      ),
    )
  }
  review = await Review.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })

  console.log(`review with id ${req.params.id} is updated`.red.bgYellow)
  res.status(200).json({ success: true, data: review })
})

// @desc: Delete review
// @route: DELETE /api/v1/reviews/:id
// @access: private
exports.deleteReview = asyncHandler(async (req, res, next) => {
  console.log('Delete Review'.red.bgYellow)
  let review = await Review.findById(req.params.id)
  if (!review) {
    return next(
      new ErrorResponse(`Review with the id ${req.params.id} not found`, 404),
    )
  }
  if (req.user != review.user.toString() && req.user.role != 'admin') {
    return next(
      new ErrorResponse(
        `The user ${req.user} is not allowed to delete this review with id ${review._id}`,
        401,
      ),
    )
  }
  review = await Review.findByIdAndDelete(req.params.id)
  console.log(`Review ${req.params.id} is deleted successfully.`)
  res.status(200).json({ success: true, data: review })
})
