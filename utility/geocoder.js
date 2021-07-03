const NodeGeoCoder = require('node-geocoder')
const options = {
  provider: process.env.GEOCODER_PROVIDER,
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null,
}
const geocoder = NodeGeoCoder(options)

exports.getGeoCode = async (address) => {
  return await geocoder.geocode(address)
}

exports.getLatAndLng = async (zip) => {
  const geocode = await geocoder.geocode(zip)
  return { latitude: geocode[0].latitude, longitude: geocode[0].longitude }
}
