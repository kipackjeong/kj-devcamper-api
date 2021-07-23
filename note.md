## Email validation regex in schema building
```js
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      'Please provide valid email',
    ],
  },
```

## **User Authentication**  

## npm package: jsonwebtoken , bcryptjs

## Encrypt password using bcryptjs

``` js
UserSchema.pre('save', async function (next) {
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
  console.log(this.password)
}) 
```

## Sign JWT
[JWT](http://jwt.io)

sign JWT in method for instance of model.

``` js
UserSchema.methods.getSignedJwtToken = function () {
  var token = jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  })
  return token
}

```

## Match password
``` js
  UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password)
  }
```

## Auth controller
``` js
exports.login = asyncHandler(async (req, res, next) => {
  // check if email and password exists in request
  const { name, email, password, role } = req.body
  if (!email || !password) {
    return next(new ErrorResponse('Invalid credentials'), 401)
  }

  // check if user exists in our database
  const user = await User.findOne({ email }).select('+password')
  console.log(user)
  if (!user) {
    return next(new ErrorResponse(`Invalid credentials ${name}`, 401))
  }

  // check if password matches
  const isMatch = await user.matchPassword(password)
  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401))
  }

  res.status(200).json({ success: true, data: user })
})
```  
note: because password field is set to select:false, .select('+password') is needed when retrieving user via email.

## **Storing token in cookie**
## npm package: cookie-parser

## Add cookieparser middleware to server.js
```js
const cookieParser = require('cookie-parser')
app.use(cookieParser)
```
### now that cookieParser is added as middleware.
We can use res.cookie
### but before that, lets wrap the regular response in controller with tokenresponse
```js
// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken()

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({ success: true, token: token })
}
```

### call this above method in controller
```js
  sendTokenResponse(user, 200, res)
```

### if you want to secure cookie i.e. in production
```js
  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
  }

  if (process.env.NODE_ENV == 'production') {
    options.secure = true
  }
  res
  .status(statusCode)
  .cookie('token', token, options)
  .json({ success: true, token: token })
```

## **Auth middleware**

## protect method to do initial authorization.
```js
exports.protect = asyncHandler(async (req, res, next) => {
  let token

  if (  // check request header 
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1]
  } else if (req.cookies.token) {   // check cookie
    token = req.cookies.token
  }

  if (!token) {
    return next(new ErrorResponse('Not authorized to access this route', 401))
  }
  // wrap it with try catch block
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = await User.findById(decoded.id)
    next()
  } catch (error) {
    return next(new ErrorResponse('Not authorized to access this route', 401))
  }
})
```

## Authorize method to authorize user by their roles
```js
exports.authorize = (...roles) => async (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(
      new ErrorResponse(
        `User role ${req.user.role} is not authorized to access this route`,
        403,
      ),
    )
  }
  next()
}

```

## attach above auth middleware's methods (protect and authorize) to the needed route.
```js
router
  .route('/')
  .get(advancedResults(Bootcamp, { path: 'courses' }), getBootcamps)
  .post(protect, authorize('admin', 'publisher'), createBootcamp)
router
  .route('/:id')
  .get(getBootcamp)
  .put(protect, updateBootcamp)
  .delete(protect, deleteBootcamp)

```

## now that I have attached my auth middleware which verifies and sets req.user from request headers, we may access req.user in any controllers.


## **Forgot Password**
## npm package: nodemailer

## Generate and return token in User.js model.
```js
// Generate and hash password token
UserSchema.methods.getResetPasswordToken = async function () {
  // Generate Token with node:crypto
  const resetToken = crypto.randomBytes(20).toString('hex')

  // Hash token and set to resetPasswordToken
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hext')

  // Set expire
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000

  return resetToken
}
```
##  use getResetPasswordToken method forgotPassword POST request

```js
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  // find user by email from req.body
  const user = await User.findOne({ email: req.body.email })

  if (!user) {
    return next(new ErrorResponse(`There is no user with that email`, 404))
  }
  // get reset token
  const resetToken = await user.getResetPasswordToken()

  await user.save({ validateBeforeSave: false })

   const resetURL = `${req.protocol}://${req.get(
    'host',
  )}/api/v1/auth/resetpassword/${resetToken}`

  const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetURL}`
  try {
    await sendEmail({
      name: user.name,
      email: user.email,
      subject: 'Password reset token',
      message,
    })
    user.resetPasswordToken = undefined
    user.resetPasswordExpire = undefined
    await user.save({ validateBeforeSave: false })
    res.status(200).json({ success: true, data: 'Email sent' })
  } catch (error) {
    console.log(error)
    return next(new ErrorResponse('Email could not be sent', 500))
  }
})
```
## Send email along with the URL auth/resetpassword/resetToken   
## so the token is saved hashed in database, but we will pass around unhashedtoken between resetpassword  and the forgotpassword request

## resetPassword PUT
```js
exports.resetPassword = asyncHandler(async (req, res, next) => {
  // Get hashed token
  const resetPasswordTokenHashed = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex')
  // find user with this resetPasswordToken (hashed)
  const user = await User.findOne({
    resetPasswordToken: resetPasswordTokenHashed,
    resetPasswordExpire: { $gt: Date.now() },
  })
  if (!user) {
    return next(new ErrorResponse('Invalid token', 400))
  }
  // Set new password
  user.password = req.body.password
  // delete resetPassword fields
  user.resetPasswordToken = undefined
  user.resetPasswordExpire = undefined
  await user.save()
  res.status(200).json({ success: true, data: 'password changed' })
})
```

## Logout Users
```js
// @desc : logout current logged in user
// @route : GET /api/v1/auth/logout
// @access : Private
exports.logout = asyncHandler(async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  })

  res.status(200).json({ success: true, data: {} })
})
```


# **API SECURITY**
## Prevent no SQL rejection / sanitize data
```
  npm i express-mongo-sanitize
```
```js
const mongoSanitize = require('express-mongo-sanitize')
// Sanitize
app.use(mongoSanitize())
```

## Security Header via using helmet
```
npm i helmet
```
```js
const helmet = require('helmet')
// Security Header
app.use(helmet())
```

## Xss clean to sanitize user input
```
npm i xss-clean
```
```js
const xssclean = require('xss-clean')
// Xss clean : sanitizes user input.
app.use(xssclean()) 
```

## Rate limiter
```
npm i express-rate-limit
```
```js
const rateLimit = require('express-rate-limit')
// Rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1,
})
app.use(limiter)
```
## HPP to protect against HTTP request parameter pollution attacks
``` 
npm i hpp
```
```js
const hpp = require('hpp')
// HPP, protect against HTTP request parameter pollution attacks
app.use(hpp())
```
## CORS, Cross Origin Resource Sharing
```
npm i cors
```
```js
const cors = require('cors')
app.use(cors())
```

 sudo apt-get install docker-ce=5:20.10.7~3-0~ubuntu-focal docker-ce-cli=5:20.10.7~3-0~ubuntu-focal containerd.io

