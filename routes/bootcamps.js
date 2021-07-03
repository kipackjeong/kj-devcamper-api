const express = require('express')
const {
  getBootcamps,
  createBootcamp,
  updateBootcamp,
  deleteBootcamp,
  getBootcamp,
  getBootcampsInRadius,
} = require('../controllers/bootcamps')
// Include other resource routers
const courseRouter = require('./courses')

const router = express.Router()
router.route('/').get(getBootcamps).post(createBootcamp)
router.route('/:id').get(getBootcamp).put(updateBootcamp).delete(deleteBootcamp)
router.route('/radius/:zipcode/:distance').get(getBootcampsInRadius)
// Re-route into other resource routers
router.use('/:bootcampId/courses', courseRouter)
module.exports = router
