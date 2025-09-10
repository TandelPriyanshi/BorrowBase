interface ButtonProps {
    buttonName: string;
    onClick?: () => void;
    type?: "button" | "submit";
    className?: string;
    disabled?: boolean;
  }
  
  const Button = ({ buttonName, onClick, type = "submit", className = "", disabled = false }: ButtonProps) => {
    const handleClick = () => {
      console.log(`Button "${buttonName}" clicked`);
      if (onClick && !disabled) onClick();
    };
  
    return (
      <button
        type={type}
        onClick={handleClick}
        disabled={disabled}
        className={`py-2.5 px-5 text-sm font-medium text-gray-900 bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700 flex-1 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className || ''}`}
      >
        {buttonName}
      </button>
    );
  };
  
  export default Button;
  