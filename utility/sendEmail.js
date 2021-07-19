const nodemailer = require('nodemailer')
const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USERNAME,
  SMTP_PASSWORD,
  SMTP_FROMEMAIL,
  SMTP_FROMNAME,
} = process.env

const sendEmail = async (options) => {
  let transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    auth: {
      user: SMTP_USERNAME,
      pass: SMTP_PASSWORD,
    },
  })

  let message = {
    from: `${SMTP_FROMNAME} <${SMTP_FROMEMAIL}>`,
    to: `kipack.jeong@outlook.com, raphilo92@gmail.com, ${options.email}`,
    subject: `${options.subject}`,
    text: `Hello ${options.name}, ${options.message}`,
    html: `Hello ${options.name}, ${options.message}`,
  }
  let info = await transporter.sendMail(message)
}

module.exports = sendEmail
