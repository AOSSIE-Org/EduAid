import React from 'react';
import logo from "../assets/aossie_logo.png";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 py-8">
      <div className="container mx-auto px-4 text-center">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Connect with us</h2>
        </div>
        <div className="flex justify-center space-x-6 mb-6">
          {/* GitHub */}
          <a
            href="https://github.com/AOSSIE-Org/EduAid"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 24 24"
              className="h-6 w-6"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.5.5.09.68-.21.68-.48v-1.7c-2.78.61-3.37-1.17-3.37-1.17-.45-1.14-1.1-1.45-1.1-1.45-.9-.62.07-.61.07-.61 1 .07 1.53 1.04 1.53 1.04.88 1.52 2.3 1.08 2.86.83.09-.64.34-1.08.61-1.33-2.22-.25-4.55-1.11-4.55-4.93 0-1.09.39-1.99 1.03-2.69-.1-.25-.45-1.28.1-2.67 0 0 .84-.27 2.75 1.03A9.56 9.56 0 0112 6.8c.85.004 1.71.11 2.51.32 1.91-1.3 2.75-1.03 2.75-1.03.55 1.39.2 2.42.1 2.67.64.7 1.03 1.6 1.03 2.69 0 3.83-2.34 4.68-4.57 4.93.35.31.66.92.66 1.85v2.74c0 .27.18.58.69.48A10.007 10.007 0 0022 12c0-5.52-4.48-10-10-10z" />
            </svg>
          </a>
          {/* GitLab */}
          <a
            href="https://gitlab.com/aossie"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 24 24"
              className="h-6 w-6"
            >
              <path d="M22.84 11.23L20.33 3.51a.8.8 0 00-1.52-.01l-1.63 4.89H7.36L5.73 3.5a.8.8 0 00-1.52.02l-2.5 7.72a.8.8 0 00.3.89L12 22.8l9.47-10.68a.8.8 0 00.37-.89z" />
            </svg>
          </a>
          {/* Twitter */}
          <a
            href="https://x.com/aossie_org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 24 24"
              className="h-6 w-6"
            >
              <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
            </svg>


          </a>
          {/* AOSSIE */}
          <a
            
            href="https://aossie.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white"
          >
             <img src={logo} alt="Aossie-logo" 
              fill="currentColor"
              viewBox="0 0 24 24"
              className="h-6 w-6"
            >
            </img>
          </a>
          {/* Discord */}
          <a
            href="https://discord.com/invite/6mFZ2S846n"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 24 24"
              className="h-6 w-6"
            >
              <path d="M20.317 4.369a19.791 19.791 0 00-4.885-1.431.074.074 0 00-.079.037c-.2.364-.419.833-.576 1.21a18.973 18.973 0 00-5.656 0 12.36 12.36 0 00-.588-1.21.07.07 0 00-.078-.037 19.797 19.797 0 00-4.886 1.43.066.066 0 00-.032.027C2.457 9.241 1.74 13.01 2.09 16.722a.075.075 0 00.028.049 19.888 19.888 0 005.993 3.058.073.073 0 00.079-.028c.461-.63.875-1.297 1.226-1.992a.07.07 0 00-.041-.097 13.175 13.175 0 01-1.872-.891.07.07 0 01-.007-.118c.126-.094.252-.192.372-.291a.074.074 0 01.074-.008c3.927 1.79 8.18 1.79 12.062 0a.073.073 0 01.075.007c.12.099.246.197.373.291a.07.07 0 01-.006.118 12.453 12.453 0 01-1.873.891.07.07 0 00-.04.097c.361.695.775 1.362 1.227 1.992a.073.073 0 00.079.028 19.886 19.886 0 005.993-3.058.073.073 0 00.028-.049c.497-5.179-.809-8.926-2.61-12.326a.061.061 0 00-.03-.028zM8.02 15.62c-1.17 0-2.13-1.092-2.13-2.426 0-1.335.946-2.427 2.13-2.427 1.185 0 2.136 1.092 2.13 2.427 0 1.334-.946 2.426-2.13 2.426zm7.963 0c-1.17 0-2.13-1.092-2.13-2.426 0-1.335.945-2.427 2.13-2.427 1.185 0 2.136 1.092 2.13 2.427 0 1.334-.945 2.426-2.13 2.426z" />
            </svg>
          </a>
        </div>
        <div className="text-sm text-gray-500">
          &copy; {new Date().getFullYear()} EduAid. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
