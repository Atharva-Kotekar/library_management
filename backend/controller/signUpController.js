// Controller for user Signup page

const UserModel = require('../models/signUpModel')
const bcrypt = require('bcrypt')
const UserOtpVerificationModel = require('../models//userOtpVerificationModel')
const nodemailer = require('nodemailer')

// Masking Email
const maskEmail = async (email) => {
  const atIndex = email.indexOf('@')
  if (atIndex <= 1) {
    return email // If the "@" symbol is at index 0 or 1, return the original email as it cannot be masked.
  }
  const emailFront = email.substring(0, atIndex)

  const maskedUsername =
    emailFront.substring(0, 1) +
    '*'.repeat(emailFront.length - 3) +
    emailFront.slice(-2)

  const domain = email.substring(atIndex)

  const result = maskedUsername + domain

  return result
}

// OTP Code Hasher
const generateOtp = async (otp_Code) => {
  const hashed_otpCode = await bcrypt.hash(String(otp_Code), 10)
  return hashed_otpCode
}

// Mail SENDER - Create a transporter with Gmail SMTP settings
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
})

// Function to send an email
const sendEmail = async (to, otp) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USERNAME,
      to,
      subject: 'Verify Email ! Library Management System',
      html: `<p>Your OTP Code is <strong>${otp}</strong>. This will expire in 60 seconds!</p>`,
    }

    const info = await transporter.sendMail(mailOptions)
    // console.log('Email sent:', info.envelope)
    // console.log('EMAIL SENT SUCCESSFULLY')
  } catch (error) {
    console.error('Error:', error)
  }
}

const postUserSignup = async (req, res) => {
  const { username, email, phone, userType, password } = req.body

  const maskedEmail = await maskEmail(email)

  const hashedPassword = await bcrypt.hash(password, 10)

  const otp_Code = Math.floor(Math.random() * 9000 + 1000)

  const hashed_otpCode = await generateOtp(otp_Code)

  // Check if user already registered
  const checkPrevUser = await UserModel.findOne({ email }).select('-password')

  if (!checkPrevUser || checkPrevUser === null) {
    const result = await UserModel.create({
      username,
      email,
      password: hashedPassword,
      phone,
      userType,
    })

    res.cookie('otp-cookie', result.id, {
      path: '/', //1000ms * sec * min * hr ->
      expires: new Date(Date.now() + 1000 * 60 * 5), // 5min otp cookie that stores userId
      httpOnly: true,
      sameSite: 'lax',
    })

    await UserOtpVerificationModel.create({
      userId: result.id,
      otpCode: hashed_otpCode,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 1000 * 60),
    })

    await sendEmail(email, otp_Code)

    return res.status(200).json({
      success: true,
      message: `Verify Email ! OTP Verification code sended to email ${maskedEmail}`,
    })
  }

  if (checkPrevUser && checkPrevUser.emailVerified == true) {
    return res.status(200).json({
      success: true,
      message: `Account already Exists, Goto Login`,
    })
  } else if (checkPrevUser && checkPrevUser.emailVerified == false) {
    res.cookie('otp-cookie', checkPrevUser.id, {
      path: '/', //1000ms * sec * min * hr ->
      expires: new Date(Date.now() + 1000 * 60 * 5), // 5min otp cookie that stores userId
      httpOnly: true,
      sameSite: 'lax',
    })

    await UserOtpVerificationModel.findOneAndUpdate(
      { userId: checkPrevUser.id },
      {
        otpCode: hashed_otpCode,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 1000 * 60),
      }
    )

    await sendEmail(email, otp_Code)

    return res.status(200).json({
      success: true,
      message: `Email Already Exists ! Verify Email,OTP Verification code sended to email ${maskedEmail}`,
    })
  }
}

const verifyEmail = async (req, res) => {
  const userInputOtp = req.body.otpCode

  const userId = req.cookies['otp-cookie']

  if (!userId || !userInputOtp) {
    return res
      .status(400)
      .json({ success: false, message: `No Otp or UserId given` })
  }

  const UserOtpData = await UserOtpVerificationModel.findOne({ userId: userId })

  const validateOtp = await bcrypt.compare(userInputOtp, UserOtpData.otpCode)

  if (!validateOtp) {
    return res.status(400).json({ success: false, message: `Invalid Otp Code` })
  }

  // Check if OTP Code has Expired or NOT
  if (new Date() > UserOtpData.expiresAt) {
    return res.status(400).json({ success: false, message: `Otp Code Expired` })
  }

  await UserModel.findByIdAndUpdate(userId, { emailVerified: true })

  return res
    .status(200)
    .json({ success: true, message: `Email Verified Successfully` })
}

const resendOtpCode = async (req, res) => {
  const userId = req.cookies['otp-cookie']

  const otp_Code = Math.floor(Math.random() * 9000 + 1000)
  const hashed_otpCode = await generateOtp(otp_Code)

  await UserOtpVerificationModel.findOneAndUpdate(
    { userId: userId },
    {
      otpCode: hashed_otpCode,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 1000 * 60),
    }
  )

  const getUserData = await UserModel.findById({ _id: userId })
  const { email } = getUserData
  const maskedEmail = await maskEmail(email)

  await sendEmail(email, otp_Code)

  return res.status(200).json({
    success: true,
    message: `OTP Verification code re-sended to email ${maskedEmail}`,
  })
}

module.exports = { postUserSignup, verifyEmail, resendOtpCode }
