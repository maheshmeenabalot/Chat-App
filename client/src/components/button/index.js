import React from 'react';

const Button = ({
  type = 'button',
  className = '',
  label = ''
}) => {
  return (
    <button 
      type={type} 
      className={`text-white bg-blue-700 hover:bg-blue-800 
        focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm text-center 
        px-2.5 py-1 ${className}`}>
      {label}
    </button>
  );
}

export default Button;
