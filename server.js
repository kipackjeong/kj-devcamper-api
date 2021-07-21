const path = require('path')
const express = require('express') // express
const dotenv = require('dotenv') // environment variable
const morgan = require('morgan') // third party logger
const connectDB = require('./config/db') // database
const colors = require('colors') // colors
const errorHandler = require('./middleware/error') // custom error handler
const fileUpload = require('express-fileupload')
const cookieParser = require('cookie-parser')
const mongoSanitize = require('express-mongo-sanitize')
const helmet = require('helmet')
const xssclean = require('xss-clean')
const rateLimit = require('express-rate-limit')
const hpp = require('hpp')
const cors = require('cors')

// Load env vars
dotenv.config({ path: './config/config.env' })

// Connect to DB
connectDB()

// // Custom Logger
// const logger = require('./middleware/logger')

const app = express()

// Body parser
app.use(express.json())

// Sanitize
app.use(mongoSanitize())

// Security Header
app.use(helmet())

// Xss clean : sanitizes user input.
app.use(xssclean())

// Rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1,
})
app.use(limiter)

// HPP, protect against HTTP request parameter pollution attacks
app.use(hpp())

// CORS cross origin resource sharing
app.use(cors())

// Third party logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}
// file upload middleware : https://www.npmjs.com/package/express-fileupload
app.use(fileUpload())

// Set static
app.use(express.static(path.join(__dirname, 'public')))

// Cookie Parser
app.use(cookieParser())

// Route files
const bootcampsRouter = require('./routes/bootcamps')
const coursesRouter = require('./routes/courses')
const authRouter = require('./routes/auth')
const usersRouter = require('./routes/users')
const reviewsRouter = require('./routes/reviews')

// Mount Routers
app.use('/api/v1/bootcamps', bootcampsRouter)
app.use('/api/v1/courses', coursesRouter)
app.use('/api/v1/auth', authRouter)
app.use('/api/v1/users', usersRouter)
app.use('/api/v1/reviews', reviewsRouter)

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
