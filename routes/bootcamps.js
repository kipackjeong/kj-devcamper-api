const express = require('express')
const {
  getBootcamps,
  createBootcamp,
  updateBootcamp,
  deleteBootcamp,
  getBootcamp,
  getBootcampsInRadius,
  bootcampPhotoUpload,
} = require('../controllers/bootcamps')
// Bring model
const Bootcamp = require('../models/Bootcamp')
// Bring middlewares
const advancedResults = require('../middleware/advancedResults')
const { protect, authorize } = require('../middleware/auth')

// Include other resource routers
const router = express.Router()
router
  .route('/')
  .get(advancedResults(Bootcamp, 'courses'), getBootcamps)
  .post(protect, authorize('admin', 'publisher'), createBootcamp)
router
  .route('/:id')
  .get(getBootcamp)
  .put(protect, authorize('admin', 'publisher'), updateBootcamp)
  .delete(protect, authorize('admin', 'publisher'), deleteBootcamp)
router.route('/radius/:zipcode/:distance').get(getBootcampsInRadius)
router
  .route('/:id/photo')
  .put(protect, authorize('admin', 'publisher'), bootcampPhotoUpload)

// Re-route into other resource routers
const courseRouter = require('./courses')
router.use('/:bootcampId/courses', courseRouter)
module.exports = router
