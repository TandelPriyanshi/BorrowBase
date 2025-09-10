import React from "react";

interface IconButtonProps {
  icon: React.ReactNode;
  onClick?: () => void;
  className?: string;
  ariaLabel?: string;
}

const IconButton = ({ icon, onClick, className = "", ariaLabel }: IconButtonProps) => {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={`p-3 text-2xl rounded-full text-white hover:text-[#EEEADE] transition-all duration-200 cursor-pointer hover:bg-white/10 ${className}`}
    >
      <span className="text-3xl">{icon}</span>
    </button>
  );
};

export default IconButton;
