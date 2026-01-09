import { FaStar } from "react-icons/fa";

export function formatToStar({ review }) {
  return (
    <div className="flex space-x-1">
      {[...Array(5)].map((_, i) => (
        <FaStar
          key={i}
          className={i < review ? "text-yellow-400" : "text-gray-300"}
        />
      ))}
    </div>
  );
}
