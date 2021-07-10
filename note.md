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

npm package need: jsonwebtoken , bcryptjs

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