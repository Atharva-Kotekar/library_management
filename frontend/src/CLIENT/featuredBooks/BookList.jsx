import React from 'react'

const BookList = (props) => {
  const { books } = props
  return (
    <div className='row'>
      {books.map((book) => {
        const { id, name, img, author } = book
        return (
          <div
            className='col-xxl-2 col-lg-3 col-md-4 col-sm-4 col-6 gy-3 '
            key={id}
          >
            <div className='card h-100'>
              <div className='card-img-top'>
                <img
                  style={{
                    height: '100%',
                    width: '100%',
                  }}
                  className='img-fluid'
                  src={img}
                  alt='book image'
                />{' '}
              </div>
              <div className='card-body'>
                <h5 className='h5 card-title'>{name}</h5>
                <p className='p card-text'>{author}</p>
                <div className='form-group mb-2 justify-content-center d-flex'>
                  <button type='button' className='btn btn-primary me-2'>
                    Buy
                  </button>
                  <button type='button' className='btn btn-secondary me-2'>
                    View
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default BookList