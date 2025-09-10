import React from "react";
import type { ChangeEvent } from "react";

interface InputProps {
  label?: string;
  type: string;
  id: string;
  placeholder: string;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
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
          icon ? "pl-10" : "pl-4"
        } pr-4 py-3 border border-gray-700 rounded-lg bg-gray-900 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-600`}
      />
    </div>
  </div>
);

export default Input;
