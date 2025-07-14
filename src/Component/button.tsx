interface ButtonProps {
    buttonName: string;
    onClick?: () => void;
    type?: "button" | "submit";
  }
  
  const Button = ({ buttonName, onClick, type = "submit" }: ButtonProps) => {
    const handleClick = () => {
      console.log(`Button "${buttonName}" clicked`);
      if (onClick) onClick();
    };
  
    return (
      <button
        type={type}
        onClick={handleClick}
        className="py-2.5 mt-4 px-5 me-2 mb-2 text-sm font-medium text-gray-900 bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700 w-full"
      >
        {buttonName}
      </button>
    );
  };
  
  export default Button;
  