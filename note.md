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

# **User Authentication**  

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

# **Storing token in cookie**
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

# **Auth middleware**

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


# **Forgot Password**
## npm package: nodemailer
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
## Generate token with node-crypto.

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

  res.status(200).json({ success: true, data: user })
})
```

