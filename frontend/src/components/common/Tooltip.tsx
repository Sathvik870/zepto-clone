import React from 'react';
import { Link } from 'react-router-dom';

interface TooltipProps {
  message: string;
  loginLink?: boolean;
}

const Tooltip: React.FC<TooltipProps> = ({ message, loginLink = false }) => {
  return (
    <div className="absolute bottom-full mb-2 w-max bg-gray-800 text-white text-xs rounded py-1 px-2 shadow-lg">
      {message}
      {loginLink && (
        <Link to="/login" className="ml-2 text-blue-400 hover:underline">
          Login
        </Link>
      )}
    </div>
  );
};

export default Tooltip;