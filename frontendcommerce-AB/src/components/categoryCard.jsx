"use client";
export function CategoryCard({ title, image }) {
  return (
    <div
      className="container w-full min-w-[80px] flex-col items-center justify-center
                  rounded-xl lg:hover:-translate-y-[2px]
                  transition-all ease-in-out p-2 space-y-2 cursor-pointer"
    >
      <div className="picture">
        <img src={image} alt={title} className="mx-auto h-[32px] w-[32px] lg:h-[50px] lg:w-[50px] "></img>
      </div>
      <div className="title">
      <h3 className="items-center justify-center text-center font-normal text-xs lg:text-sm text-primary-700">{title}</h3>
      </div>
    </div>
  );
}
