import React, { useState } from 'react';
import Input from '../../components/input';
import Button from '../../components/button';
import { useNavigate } from 'react-router-dom';

function Form({ isSignInPage = true }) {
  const [data, setData] = useState({
    ...(isSignInPage ? {} : { fullName: '' }),
    email: '',
    password: ''
  });

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Data : >>', data); // Log form data once
    try {
      const res = await fetch(`http://localhost:8000/api/${isSignInPage ? 'login' : 'register'}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (res.status === 400) {
        alert('Invalid Credentials');
      } else {
        const resData = await res.json();
        console.log('Data : >>', resData);
        if (resData.token) {
          localStorage.setItem('user:token', resData.token);
          localStorage.setItem('user:detail', JSON.stringify(resData.user));
          console.log('user : >>', resData.user); // Log user data once
          navigate('/');
        }
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-white">
      <div className="bg-white w-[400px] h-[550px] shadow-lg flex flex-col justify-center items-center">
        <div className='text-4xl font-extrabold'>Welcome {isSignInPage ? 'Back' : ''}</div>
        <div className='text-xl font-light mb-4'>{isSignInPage ? 'Sign in to get explored' : 'Sign up now to get started'}</div>
        <form className='w-full flex flex-col items-center justify-center' onSubmit={handleSubmit}>
          {!isSignInPage && (
            <Input
              label="Full Name"
              name="fullName"
              type="text"
              placeholder="Enter your full name"
              value={data.fullName}
              onChange={(e) => setData({ ...data, fullName: e.target.value })}
              className='w-[75%]'
              isRequired={true}
            />
          )}
          <Input
            label="Email"
            name="email"
            type="email"
            placeholder="Enter your email"
            isRequired={true}
            value={data.email}
            onChange={(e) => setData({ ...data, email: e.target.value })}
            className='w-[75%]'
          />
          <Input
            label="Password"
            name="password"
            type="password"
            placeholder="Make your password"
            isRequired={true}
            value={data.password}
            onChange={(e) => setData({ ...data, password: e.target.value })}
            className='mb-4 w-[75%]'
          />
          <Button
            label={isSignInPage ? 'Sign In' : 'Sign Up'}
            className='my-2 w-[75%] mb-2'
            type='submit'
          />
        </form>
        <div>
          {isSignInPage ? "Didn't have an account?" : 'Already have an account?'}
          <span className='cursor-pointer text-blue-800' onClick={() => navigate(`../../user/${isSignInPage ? 'sign_up' : 'sign_in'}`)}>
            {isSignInPage ? 'Sign Up' : 'Sign In'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default Form;
