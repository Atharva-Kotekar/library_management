const BookTransaction = require('../models/bookTransaction')
const BookSchema = require('../models/bookScheme')
const PopularBookSchema = require('../models/PopularBooks')
const UserSchema = require('../models/signUpModel')

// Creates a new User book request transaction
const postBooks = async (req, res) => {
  const userId = req.userId
  const username = req.username
  const userEmail = req.userEmail
  const { bookId } = req.body

  // User can request upto 5 Books
  const getUserData = await UserSchema.findById(userId)
  // Users total books requested
  const { totalRequestedBooks } = getUserData

  if (totalRequestedBooks >= 5) {
    return res
      .status(400)
      .json({ success: false, message: `Books Limit Reached` })
  }

  // Book title fetch
  const bookDetails = await BookSchema.findById(bookId)
  const { title } = bookDetails

  // Check if user has previously requested for same book with id
  const checkPrevRequest = await BookTransaction.findOne({ userId, bookId })

  if (checkPrevRequest) {
    return res
      .status(400)
      .json({ success: false, message: `Book already Requested` })
  } else {
    await createBookTransaction()
  }

  async function createBookTransaction() {
    const result = await BookTransaction.create({
      userId,
      bookId,
      userEmail,
      username,
      bookTitle: title,
    })

    // Update users total requested books on 'UserDetails' collection
    const updatedTotalRequestedBooks = totalRequestedBooks + 1
    await UserSchema.findByIdAndUpdate(userId, {
      totalRequestedBooks: updatedTotalRequestedBooks,
    })

    return res.status(200).json({ success: true, data: result })
  }
}

// ADMIN issue book to a USER using BookId and UserEmail
const postIssueBooks = async (req, res) => {
  const { bookId, userEmail } = req.body

  // User can request upto 5 Books
  const getUserData = await UserSchema.findOne({ email: userEmail })

  if (!getUserData) {
    return res
      .status(400)
      .json({ success: false, message: `Email doesn't Exists` })
  }

  // Users total requseted books requested
  const { totalRequestedBooks, totalAcceptedBooks, _id, username } = getUserData
  const userId = _id.toString() //converting raw ID to string only

  if (totalRequestedBooks >= 5) {
    return res
      .status(400)
      .json({ success: false, message: `Books Limit Reached` })
  }

  // Book title fetch
  const bookDetails = await BookSchema.findById(bookId)
  const { title } = bookDetails

  // Check if user has previously requested for same book with id
  const checkPrevRequest = await BookTransaction.findOne({ userId, bookId })

  if (checkPrevRequest) {
    return res
      .status(400)
      .json({ success: false, message: `Book already Issued` })
  } else {
    const result = await BookTransaction.create({
      userId,
      bookId,
      userEmail,
      username,
      bookTitle: title,
      issueStatus: 'ACCEPTED',
      issueDate: new Date(),
      returnDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // Add 10 days to the current date
    })

    // Update users total requested books on 'UserDetails' collection
    const updatedTotalAcceptedBooks = totalAcceptedBooks + 1
    const updatedTotalRequestedBooks = totalRequestedBooks + 1
    await UserSchema.findByIdAndUpdate(userId, {
      totalAcceptedBooks: updatedTotalAcceptedBooks,
      totalRequestedBooks: updatedTotalRequestedBooks,
    })

    return res.status(200).json({ success: true, data: result })
  }
}

// issueStatus (filter PENDING BooksTransaction)
const getRequestedBooks = async (req, res) => {
  const result = await BookTransaction.find({ issueStatus: 'PENDING' })
  res
    .status(200)
    .json({ success: true, totalHits: result.length, data: result })
}

// NOT RETURNED BOOKS, filters ( ACCEPTED + notReturned Books)
const getNotReturnedBooks = async (req, res) => {
  const result = await BookTransaction.find({
    issueStatus: 'ACCEPTED',
    isReturned: false,
  })
  res
    .status(200)
    .json({ success: true, totalHits: result.length, data: result })
}

// Update book issue Status
const patchRequestedBooks = async (req, res) => {
  const { id, issueStatus, isReturned } = req.body

  // if issueStatus ayo vane issueStatus only update that , and viceversa
  const result = await BookTransaction.findByIdAndUpdate(
    id,
    {
      issueStatus,
      isReturned,
    },
    {
      new: true,
      runValidators: true,
    }
  )

  // Fetching Book ID and Book Title for updating popular books if STATUS is ACCEPTED
  const { bookId, bookTitle, userId, returnDate } = result

  // If book return TRUE ,
  if (isReturned) {
    // increment users TotalAcceptedBooks
    const getUserData = await UserSchema.findById(userId)
    const { totalAcceptedBooks, totalRequestedBooks } = getUserData
    const updatedTotalAcceptedBooks = totalAcceptedBooks - 1
    const updatedTotalRequestedBooks = totalRequestedBooks - 1

    await UserSchema.findByIdAndUpdate(userId, {
      totalAcceptedBooks: updatedTotalAcceptedBooks,
      totalRequestedBooks: updatedTotalRequestedBooks,
    })
  }

  // If "ACCEPTED" then push that into popular books collection
  if (issueStatus === 'ACCEPTED') {
    // update issueDate and returnDate
    await BookTransaction.findByIdAndUpdate(id, {
      issueDate: new Date(),
      returnDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // Add 10 days to the current date
    })

    // increment users TotalAcceptedBooks
    const getUserData = await UserSchema.findById(userId)
    const { totalAcceptedBooks } = getUserData
    const updatedTotalAcceptedBooks = totalAcceptedBooks + 1

    await UserSchema.findByIdAndUpdate(userId, {
      totalAcceptedBooks: updatedTotalAcceptedBooks,
    })

    createOrUpdatePopularBook(bookId, bookTitle)
  } else if (issueStatus === 'CANCELLED') {
    // user's id destructer to decrement total books qty for users so he can request for a new books
    const getUserData = await UserSchema.findById(userId)

    // destructure user's total books qty and decrement by 1
    const { totalRequestedBooks } = getUserData
    const updatedTotalRequestedBooks = totalRequestedBooks - 1
    await UserSchema.findByIdAndUpdate(userId, {
      totalRequestedBooks: updatedTotalRequestedBooks,
    })
  }

  res
    .status(200)
    .json({ success: true, totalHits: result.length, data: result })
}

// POPULAR BOOKS TRACKING FUNCTION
const createOrUpdatePopularBook = async (bookId, bookTitle) => {
  const checkPopularBook = await PopularBookSchema.findOne({ bookId })

  if (!checkPopularBook) {
    // If book does not exist in popular collection, create a new one
    await PopularBookSchema.create({
      bookId,
      bookTitle,
    })
  } else {
    // If book already exists in popular collection, increment issueQuantity
    const updatedIssueQuantity = checkPopularBook.issueQuantity + 1

    await PopularBookSchema.findOneAndUpdate(
      { bookId },
      { issueQuantity: updatedIssueQuantity },
      {
        new: true, // Return the updated document
        runValidators: true, // Run validation rules on update
      }
    )
  }
}

module.exports = {
  postBooks,
  getRequestedBooks,
  patchRequestedBooks,
  getNotReturnedBooks,
  postIssueBooks,
}
