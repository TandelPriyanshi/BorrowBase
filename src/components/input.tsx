import React from "react";

interface InputProps {
  label?: string;
  type: string;
  id: string;
  placeholder: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon?: React.ReactNode;
}

const Input = ({
  label,
  type,
  id,
  placeholder,
  value,
  onChange,
  icon,
}: InputProps) => (
  <div className="mb-4">
    {label && (
      <label htmlFor={id} className="block text-white mb-1">
        {label}
      </label>
    )}
    <div className="relative">
      {icon && (
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          {icon}
        </span>
      )}
      <input
        type={type}
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full ${
          icon ? "pl-10" : "pl-3"
        } pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-white text-white bg-transparent`}
      />
    </div>
  </div>
);

export default Input;
