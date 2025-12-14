import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "../index.css";
const NotFound = () => {
    const router = useNavigate()
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => prev - 1);
        }, 1000);

        const redirect = setTimeout(() => {
            router('/')
        }, 5000);

        return () => {
            clearInterval(timer);
            clearTimeout(redirect);
        };
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center popup bg-light-bg bg-custom-gradient">
            <div className="text-center p-8 bg-white rounded-lg shadow-xl max-w-md border-2 border-light-border">
                <h1 className="text-6xl font-bold bg-gradient-to-r from-[#FF6B9D] to-[#4ECDC4] text-transparent bg-clip-text mb-4">404</h1>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Page Not Found</h2>
                <p className="text-gray-600 mb-6">
                    Oops! The page you're looking for doesn't exist.
                </p>
                <p className="text-gray-500">
                    Redirecting to home page in <span className="text-[#4ECDC4] font-semibold">{countdown}</span> seconds...
                </p>
            </div>
        </div>
    );
};

export default NotFound;