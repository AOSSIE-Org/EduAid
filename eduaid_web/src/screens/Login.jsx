import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import loginImg from '../assets/loginimg.png';
import loginImg2 from '../assets/loginimg2.png';
import axios from '../config/axios.js';
import { UserContext } from '../context/user.context.jsx';
import starsImg from "../assets/stars.png"; // You can add this for decoration, if needed

const Login = () => {
  const Navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { setUser } = useContext(UserContext);

  function submitHandler(e) {
    e.preventDefault();
    axios.post('/users/login', { email, password })
      .then((res) => {
        console.log(res.data);
        localStorage.setItem('token', res.data.token);
        setUser(res.data.user);
        Navigate('/');
      })
      .catch((err) => {
        console.log(err);
      });
  }

  return (
    <div className="flex items-center justify-center min-h-screen  bg-[#1c6a94] relative">
      {/* Background Images */}
      <img
        src={loginImg}
        alt="Background Image"
        className="absolute bottom-0 left-0 z-0 opacity-60"
      />
      <img
        src={loginImg2}
        alt="Secondary Background Image"
        className="absolute top-10 right-0 z-0 opacity-50"
        style={{ width: '400px', height: 'auto' }}
      />

      <div className=" bg-[#5fb9c9] p-10 rounded-lg shadow-xl w-full max-w-lg z-10 animate__animated animate__fadeIn">
       
        {/* Title */}
        <h2 className="text-3xl font-bold text-center text-[#1A1A2E] mb-8 animate__animated animate__fadeIn animate__delay-1s">
          Login
        </h2>

        {/* Login Form */}
        <form onSubmit={submitHandler}>
          <div className="mb-6">
            <label className="block text-[#1A1A2E] font-semibold mb-2" htmlFor="email">
              Email
            </label>
            <input
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              id="email"
              className="w-full p-4 border border-[#0B3B44] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4A6C74] bg-[#EEEEEE] text-[#1A1A2E] transition duration-300 ease-in-out"
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-[#1A1A2E] font-semibold mb-2" htmlFor="password">
              Password
            </label>
            <input
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              id="password"
              className="w-full p-4 border border-[#0B3B44] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4A6C74] bg-[#EEEEEE] text-[#1A1A2E] transition duration-300 ease-in-out"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#0B3B44] text-[#EEEEEE] p-3 rounded-lg hover:bg-[#1A1A2E] transition duration-300 ease-in-out"
          >
            Login
          </button>
        </form>

        {/* Sign Up Link */}
        <p className="mt-6 text-center text-[#EEEEEE]">
          Don't have an account?{' '}
          <Link to="/register" className="text-[#1A1A2E] hover:underline font-semibold">
            Sign Up
          </Link>
        </p>
      
      </div>
    </div>
  );
};

export default Login;
