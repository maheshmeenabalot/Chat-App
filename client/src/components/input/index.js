import React, { useState } from 'react';

const Input = ({
  label = '',
  name = '',
  type = 'text',
  className ='',
  inputclassName = '',
  isRequired = false,
  placeholder = '',
  value='',
  onChange = () => {},
}) => {
  return (
    <div className={` w-1/2 ${className}`}>
      <label htmlFor={name} className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">
        {label}
      </label>
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        className={`mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400
          focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500
          disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 disabled:shadow-none
          invalid:border-black-500 invalid:text-black-600
          focus:invalid:border-black-500 focus:invalid:ring-black-500 ${inputclassName}`}
        placeholder={placeholder} onChange={onChange}
        required={isRequired}
      />
    </div>
  );
};

export default Input;
