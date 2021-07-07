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

const Bootcamp = require('../models/Bootcamp')
const advancedResults = require('../middleware/advancedResults')

// Include other resource routers
const router = express.Router()
router
  .route('/')
  .get(advancedResults(Bootcamp, { path: 'courses' }), getBootcamps)
  .post(createBootcamp)
router.route('/:id').get(getBootcamp).put(updateBootcamp).delete(deleteBootcamp)
router.route('/radius/:zipcode/:distance').get(getBootcampsInRadius)
router.route('/:id/photo').put(bootcampPhotoUpload)

// Re-route into other resource routers
const courseRouter = require('./courses')
router.use('/:bootcampId/courses', courseRouter)
module.exports = router
