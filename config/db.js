const mongoose = require('mongoose')
const colors = require('colors')

const connectDB = async () => {
  const conn = await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    autoIndex: false,
  })
  console.log(
    colors.cyan.underline(`MongoDB Connected ${conn.connection.host}`),
  )

  mongoose
}

module.exports = connectDB
