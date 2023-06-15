import React, { useEffect, useState } from 'react'
import { backend_server } from '../../main'
import axios from 'axios'
import { Link } from 'react-router-dom'

const RecentlyAddedBooks = () => {
  const recentBooks_Api_URL = `${backend_server}/api/v1/recentBooks`

  const [latestBooks, setLatestBooks] = useState([])

  const fetchData = async () => {
    try {
      const response = await axios.get(recentBooks_Api_URL)

      const fetchedBooks = await response.data.data

      setLatestBooks(fetchedBooks)
    } catch (error) {
      console.log(error.respose)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <div className='row'>
      <h1 className='h1 mt-3' style={{ textAlign: 'center' }}>
        Latest Books
      </h1>

      {/* Recently added Books */}
      <div className='row'>
        {latestBooks.map((book) => {
          const { _id, title, image, author } = book
          const imgSrc = `${backend_server}/${image}`

          return (
            <div
              className='col-xxl-2 col-lg-3 col-md-4 col-sm-4 col-6 gy-3 '
              key={_id}
            >
              <div className='card h-100'>
                <div className='card-img-top'>
                  <img
                    style={{
                      height: '100%',
                      width: '100%',
                    }}
                    className='img-fluid'
                    src={imgSrc}
                    alt='book image'
                  />{' '}
                </div>

                <div className='card-body'>
                  <h5 className='h5 card-title'>{title}</h5>
                  <p className='p card-text'>{author}</p>
                  <div className='form-group mb-2 justify-content-center d-flex'>
                    {/* Request Books Button */}
                    <button type='button' className='btn btn-primary me-2'>
                      Buy
                    </button>

                    {/* View Books Button */}
                    <Link to={`/books/${_id}`}>
                      <button type='button' className='btn btn-secondary me-2'>
                        View
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default RecentlyAddedBooks
