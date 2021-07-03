const logger = (req, res, next) => {
  console.log(
    ` Request Method : ${req.method} \n Request Protocal and Host: ${
      req.protocol
    }://${req.get('host')}${req.originalUrl}`,
  )
  next()
}

module.exports = logger
