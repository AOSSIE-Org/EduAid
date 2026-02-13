import React, { useEffect } from 'react';
import { FiAlertCircle, FiX } from 'react-icons/fi';

/**
 * ErrorToast Component
 * Displays user-friendly error notifications with auto-dismiss
 * 
 * @param {string} message - Error message to display
 * @param {function} onClose - Callback function when toast is dismissed
 * @param {number} duration - Auto-dismiss duration in ms (default: 5000)
 */
const ErrorToast = ({ message, onClose, duration = 5000 }) => {
  useEffect(() => {
    if (!message) return;

    // Auto-dismiss after specified duration
    const timer = setTimeout(() => {
      if (onClose) {
        onClose();
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [message, duration]);

  if (!message) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
      <div className="bg-red-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[300px] max-w-[500px]">
        <FiAlertCircle className="text-2xl flex-shrink-0" />
        <p className="font-medium text-sm sm:text-base flex-1">{message}</p>
        <button
          onClick={onClose}
          className="ml-2 hover:bg-red-600 rounded-full p-1 transition-colors"
          aria-label="Close notification"
        >
          <FiX className="text-xl" />
        </button>
      </div>
    </div>
  );
};

export default ErrorToast;
