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
// static method to get avg of course tuitions
CourseSchema.statics.getAverageCost = async function (bootcampId) {
  console.log('Calculating avg cost...'.blue)

  // calculate average cost
  //aggregation - https://masteringjs.io/tutorials/mongoose/aggregate

  const obj = await this.aggregate([
    { $match: { bootcamp: bootcampId } },
    {
      $group: {
        _id: '$bootcamp',
        averageCost: { $avg: '$tuition' },
        // count: { $sum: 1 },
      },
    },
  ])
  // apply new averageCost for corresponding bootcamp.
  try {
    // this.model - https://mongoosejs.com/docs/api/model.html#model_Model-model
    await this.model('Bootcamp').findByIdAndUpdate(bootcampId, {
      averageCost: Math.ceil(obj[0].averageCost / 10) * 10,
    })
  } catch (error) {
    console.error(error)
  }
}

// Call getAverageCost after save
CourseSchema.post('save', async function () {
  // Object.constructor - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/constructor
  await this.constructor.getAverageCost(this.bootcamp)

  console.log(`${this.title} course created in DB`.yellow)
})
// Call getAverageCost before remove
CourseSchema.pre('remove', async function () {
  this.constructor.getAverageCost(this.bootcamp)
  console.log(`${this.title} course deleted from DB`)
})
module.exports = mongoose.model('Course', CourseSchema)
