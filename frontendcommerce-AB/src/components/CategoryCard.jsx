"use client";
export function CategoryCard({ title, image }) {
  return (
    <div
      className="container w-full flex-col items-center justify-center
                  bg-white rounded-xl hover:outline-1 outline-primary-300 hover:-translate-y-[2px] 
                  transition-all ease-in-out p-2 space-y-2 cursor-pointer"
    >
      <div className="picture">
        <img src={image} alt={title} className="mx-auto h-[50px] w-[50px]"></img>
      </div>
      <div className="title">
      <h3 className="items-center justify-center text-center font-normal text-sm text-primary-700">{title}</h3>
      </div>
    </div>
  );
}
