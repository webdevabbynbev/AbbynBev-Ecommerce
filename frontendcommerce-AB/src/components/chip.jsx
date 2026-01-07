const Chip = ({ isActive, onClick, children, className="", ...props }) => {
  return (
    <button
      onClick={onClick}
      className={`w-auto h-auto rounded-full py-2 px-4 text-primary-700 text-xs outline-1 outline-primary-700
      ${
        isActive
          ? "bg-primary-700 text-white border-primary-700 hover:cursor-pointer"
          : "bg-transparent text-primary-700 border-primary-700 hover:bg-primary-100 hover:cursor-pointer"
      }${className}`}
      
      
      {...props}
    >
      {children}
    </button>
  );
};

export { Chip };
