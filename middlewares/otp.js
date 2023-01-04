const nodemailer = require('nodemailer');
require('dotenv').config()

module.exports={
     mailTransporter:nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.NODEMAILER_USER,
          pass: process.env.NODEMAILER_PASS
        },
      }),
     OTP : `${Math.floor(1000 + Math.random() * 9000)}`,
}