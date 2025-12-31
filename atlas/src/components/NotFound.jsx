import React from 'react'
import Logo from './Logo'
import { Link } from 'react-router-dom'

const NotFound = () => {
  return (
       <div className='flex h-screen justify-center items-center'>
        <div className='flex flex-col items-center'>
            <Logo/>
            <span className='text-5xl font-extrabold'>
            404 Error | Page Not Found
            </span>
            <p className='my-6'>
            There's nothing here
            </p>
            <Link to={"/"}>
            <button className='rounded-full'>Back to Home</button>
            </Link>
        </div>
    </div>
  
  )
}

export default NotFound