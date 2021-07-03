const express = require('express') // express
const dotenv = require('dotenv') // environment variable
const morgan = require('morgan') // third party logger
const connectDB = require('./config/db') // database
const colors = require('colors') // colors
const errorHandler = require('./middleware/errorHandler') // custom error handler

// Load env vars
dotenv.config({ path: './config/config.env' })

// Connect to DB
connectDB()

// Route files
const bootcampsRouter = require('./routes/bootcamps')
const coursesRouter = require('./routes/courses')

// // Custom Logger
// const logger = require('./middleware/logger')

const app = express()

// Body parser
app.use(express.json())

// Third party logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

// Mount Routers
app.use('/api/v1/bootcamps', bootcampsRouter)
app.use('/api/v1/courses', coursesRouter)

app.use(errorHandler)

const PORT = process.env.PORT || 5000

const server = app.listen(PORT, () =>
  console.log(
    colors.yellow.bold(
      `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`,
    ),
  ),
)

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(colors.red.underline(`Error: ${err.message}`))
  // Close server and exit process
  server.close(() => process.exit(1))
})
