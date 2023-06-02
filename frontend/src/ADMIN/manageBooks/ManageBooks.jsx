import React, { useEffect, useState } from 'react'
import ManageSearchBooks from './ManageSearchBooks'
import axios from 'axios'
import './managebooks.css'

// API BASE URL
import { backend_server } from '../../main'
import { Link } from 'react-router-dom'

const ManageBooks = () => {
  const API_URL = `${backend_server}/api/v1/books`

  const [allBooks, setAllBooks] = useState([])
  const [totalBooksCount, setTotalBooksCount] = useState(null)

  const fetchBooks = async () => {
    try {
      const response = await axios.get(API_URL)
      setAllBooks(response.data.data)
      setTotalBooksCount(response.data.totalHits)
    } catch (error) {}
  }

  useEffect(() => {
    fetchBooks()
  }, [])

  return (
    <div className='container '>
      <h1 className='h1 text-center'>Manage Books </h1>

      <div className='row my-3'>
        <ManageSearchBooks />
      </div>

      {/* TABLE BOOK DATA */}
      <div className='row mt-3'>
        <table className='table table-hover'>
          <thead>
            <tr>
              <th scope='col'>#</th>
              <th scope='col'>Title</th>
              <th scope='col'>Category</th>
              <th scope='col'>Featured</th>
              <th scope='col'>Available</th>
            </tr>
          </thead>
          <tbody>
            {allBooks.map((book, index) => {
              const { _id, title, category, featured, available } = book

              // Convert boolean values to strings
              const featuredText = featured ? 'Yes' : 'No'
              const availableText = available ? 'Yes' : 'No'

              return (
                <tr key={_id}>
                  <th scope='row'>{index + 1}</th>
                  <td>{title}</td>
                  <td>{category}</td>
                  <td>{featuredText}</td>
                  <td>{availableText}</td>
                  <td>
                    <Link to={`admin-edit-books/${_id}`}>
                      <button className='btn mx-1 edit-books-btn'>Edit</button>
                    </Link>
                    <button className='btn mx-1 delete-books-btn'>
                      Delete
                    </button>
                  </td>
                </tr>
              )
            })}
            {/* <tr>
              <th scope='row'>ID</th>
              <td>Death : An Inside Story </td>
              <td>Spiritual</td>
              <td>True</td>
              <td>True</td>
              <td>
                <button className='btn mx-1 edit-books-btn'>Edit</button>
                <button className='btn mx-1 delete-books-btn'>Delete</button>
              </td>
            </tr> */}
          </tbody>
        </table>
        <p>admin le filter garnu milna paryo for faster edit</p>
        <p>category,featured in form </p>
      </div>
    </div>
  )
}

export default ManageBooks
