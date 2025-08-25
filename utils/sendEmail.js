// utils/sendEmail.js
const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, html) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail', // you can use other services or SMTP
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Your App" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log('📧 Email sent successfully to', to);
  } catch (err) {
    console.error('❌ Email sending failed:', err);
    throw new Error('Email could not be sent');
  }
};

module.exports = sendEmail;
