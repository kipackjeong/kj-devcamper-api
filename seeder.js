const fs = require('fs')
const mongoose = require('mongoose')
const colors = require('colors')
const dotenv = require('dotenv')
const seeder = require('mongoose-seed')

// Load env vars
dotenv.config({ path: './config/config.env' })

// Load models
const Bootcamp = require('./models/Bootcamp')
const Course = require('./models/Course')
const User = require('./models/User')
const Review = require('./models/Review')

// Connect to DB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: true,
  useUnifiedTopology: true,
  autoIndex: false,
})

// Read JSON files
const bootcamps = JSON.parse(
  fs.readFileSync(`${__dirname}/_data/bootcamps.json`, 'utf-8'),
)
const courses = JSON.parse(
  fs.readFileSync(`${__dirname}/_data/courses.json`, 'utf-8'),
)
const users = JSON.parse(
  fs.readFileSync(`${__dirname}/_data/users.json`, 'utf-8'),
)
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/_data/reviews.json`, 'utf-8'),
)

// Import into DB
const importData = async () => {
  try {
    await Bootcamp.create(bootcamps)
    console.log('Bootcamps seeding completed')
    await Course.create(courses)
    console.log('Courses seeding completed')
    // await User.create(users)
    await Review.create(reviews)
    console.log('Reviews seeding completed')

    process.exit()
  } catch (error) {
    console.error(error.red)
  }
}

// Delete data
const deleteData = async () => {
  try {
    await Bootcamp.deleteMany()
    await Course.deleteMany()
    // await User.deleteMany()
    await Review.deleteMany()

    process.exit()
  } catch (error) {
    console.error(error.red)
  }
}

if (process.argv[2] === '-i') {
  console.log('Data imported...'.green.inverse)
  importData()
} else if (process.argv[2] === '-d') {
  console.log('Data destroyed'.red.inverse)
  deleteData()
}
