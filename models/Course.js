const mongoose = require('mongoose')
const color = require('colors')

const CourseSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    required: [true, 'Please add title'],
  },
  description: {
    type: String,
    required: [true, 'Please add description'],
  },
  weeks: {
    type: String,
    required: [true, 'Please add number of weeks'],
  },
  tuition: {
    type: Number,
    required: [true, 'Please add tuition'],
  },
  minimumSkill: {
    type: String,
    required: [true, 'Please add minimum skill'],
    enum: ['beginner', 'intermediate', 'advanced'],
  },
  scholarshipAvailable: {
    type: Boolean,
    default: false,
  },
  createAt: {
    type: Date,
    default: Date.now,
  },
  bootcamp: {
    type: mongoose.Schema.ObjectId,
    ref: 'Bootcamp',
    required: true,
  },
})
// Call getAverageCost after save
CourseSchema.post('save', async function () {
  console.log(`${this.title} course created in DB`.yellow)
})
// Call getAverageCost before remove
CourseSchema.pre('remove', async function () {
  console.log(`${this.title} course deleted from DB`)
})
module.exports = mongoose.model('Course', CourseSchema)
