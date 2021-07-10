const advancedResults = (model, populate) => async (req, res, next) => {
  let query

  // Copy req.query
  const reqQuery = { ...req.query }
  // Fields to exclude
  const removeFields = ['select', 'sort', 'page', 'limit']

  // Loop over removeFields and delete them from reqQuery
  removeFields.forEach((param) => delete reqQuery[param])
  // Create query string
  let queryStr = JSON.stringify(reqQuery)

  // Create operators ($gt,$gte,$lt,$lte,$in)
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, (match) => `$${match}`)
  query = model.find(JSON.parse(queryStr))

  // Select Fields ex) &select=description,name
  if (req.query.select) {
    let selectedFields = req.query.select.split(',').join(' ')

    query.select(selectedFields)
  }

  // Sort  ex) &sort=-name
  if (req.query.sort) {
    let sortOptions = req.query.sort.split(',').join(' ')
    query.sort(sortOptions)
  } else {
    query.sort('-createdAt')
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1
  const limit = parseInt(req.query.limit, 10) || 10
  const startIndex = (page - 1) * limit
  const endIndex = page * limit
  const total = await model.countDocuments()

  query.skip(startIndex).limit(limit)

  if (populate) {
    query.populate(populate)
  }

  // Executing query
  const results = await query

  // Pagination result
  const pagination = {}

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit,
    }
  }

  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit,
    }
  }

  res.advancedResults = {
    success: true,
    count: results.length,
    pagination,
    data: results,
  }
  next()
}

module.exports = advancedResults
