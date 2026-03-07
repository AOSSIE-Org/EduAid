import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import "../index.css";
import logoPNG from "../assets/aossie_logo_transparent.png";
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
        <div className="popup grid-bg w-screen min-h-screen flex justify-center items-center">
            <div className="w-full h-full overflow-auto px-4 py-6 sm:px-8 md:px-16">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <Link to="/" className="flex items-end gap-2 mb-8">
                        <img 
                            src={logoPNG} 
                            alt="logo" 
                            className="w-12 sm:w-16 block" 
                        />
                        <div className="text-xl sm:text-2xl font-extrabold">
                            <span className="bg-gradient-to-r from-[#FF005C] to-[#7600F2] text-transparent bg-clip-text">
                                Edu
                            </span>
                            <span className="bg-gradient-to-r from-[#7600F2] to-[#00CBE7] text-transparent bg-clip-text">
                                Aid
                            </span>
                        </div>
                    </Link>

                    {/* 404 Content */}
                    <div className="flex flex-col items-center justify-center text-center py-16">
                        <div className="bg-[#45454533] backdrop-blur-sm rounded-2xl p-8 max-w-md border border-[#ffffff20]">
                            <h1 className="text-6xl font-bold bg-gradient-to-r from-[#FF005C] to-[#7600F2] text-transparent bg-clip-text mb-4">404</h1>
                            <h2 className="text-2xl font-semibold text-white mb-4">Page Not Found</h2>
                            <p className="text-gray-300 mb-6">
                                Oops! The page you're looking for doesn't exist.
                            </p>
                            <p className="text-gray-400 mb-6">
                                Redirecting to home page in <span className="text-[#00CBE7] font-bold">{countdown}</span> seconds...
                            </p>
                            <Link to="/">
                                <button className="w-full sm:w-auto flex justify-center items-center gap-3 text-lg text-white px-6 py-3 bg-gradient-to-r from-[#FF005C] via-[#7600F2] to-[#00CBE7] rounded-lg hover:opacity-90 transition-all duration-300">
                                    Go Home Now
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotFound;