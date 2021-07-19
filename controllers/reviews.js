const ErrorResponse = require(`../utility/errorResponse`)
const asyncHandler = require('../middleware/async')
const Review = require(`../models/Review`)
const Bootcamp = require('../models/Bootcamp')

// @desc: Get all reviews
// @route: Get /api/v1/reviews
// @route: Get /api/v1/bootcamps/:bootcampId/reviews
// @access: public
exports.getReviews = asyncHandler(async (req, res, next) => {
  if (req.params.bootcampId) {
    const reviews = await Review.find({ bootcamp: req.params.bootcampId })
    return res
      .status(200)
      .json({ success: true, count: reviews.length, data: reviews })
  } else {
    res.status(200).json(res.advancedResults)
  }
})
