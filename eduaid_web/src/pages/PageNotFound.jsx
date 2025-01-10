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
        <div className="min-h-screen flex items-center justify-center  popup bg-[#02000F] bg-custom-gradient">
            <div className="text-center p-8 bg-gray-800 rounded-lg shadow-xl max-w-md border border-gray-700">
                <h1 className="text-6xl font-bold text-blue-400 mb-4">404</h1>
                <h2 className="text-2xl font-semibold text-gray-200 mb-4">Page Not Found</h2>
                <p className="text-gray-300 mb-6">
                    Oops! The page you're looking for doesn't exist.
                </p>
                <p className="text-gray-400">
                    Redirecting to home page in <span className="text-blue-400">{countdown}</span> seconds...
                </p>
            </div>
        </div>
    );
};

export default NotFound;