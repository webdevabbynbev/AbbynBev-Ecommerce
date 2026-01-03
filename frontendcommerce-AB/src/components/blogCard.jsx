"use client";
import { BtnIcon, BtnIconToggle } from ".";
import { formatDistanceToNow } from "date-fns";

export function BlogCard({
  create_at,
  image,
  imgTitle,
  title,
  category,
  article,
  like,
  comment,
  share,
}) {
  return (
    <div
      className="Container flex-row bg-white p-4 w-full h-auto space-y-4 rounded-3xl
                    hover:-translate-y-[2px] hover:outline-1 outline-primary-300 transition-all ease-in-out cursor-pointer duration-300"
    >
      <div className="Content-wrapper flex justify-between">
        <div className="wrapper-left-content flex space-x-2 items-center">
          <span className="text-sm">Abby n Bev</span>
          <div className="w-1 h-1 rounded-full bg-neutral-400"></div>
          <span className="text-sm text-neutral400 "> {formatDistanceToNow(create_at)} </span>
        </div>
        {/* <BtnIcon variant="tertiary" size="sm" iconName="EllipsisV"/> */}
      </div>

      <div className="flex-row space-y-3">
        <img src={image} alt={imgTitle} className="rounded-lg" />
        <div className="flex items-center space-x-2">
          <p className="text-xs font-bold">Category</p>
          <span className="rounded-lg text-xs px-3 py-2  text-primary-700 bg-primary-100 font-bold">
            {category}
          </span>
        </div>
        <h1 className="text-bold text-sm font-bold"> {title} </h1>
        <div className="p-2 w-full rounded-lg">
          <p className="text-sm line-clamp-2">{article}</p>
        </div>
      </div>

      <div className="flex space-x-4">
        <div className="flex items-center space-x-3">
          <BtnIconToggle variant="tertiary" size="sm" iconName="ThumbsUp" > </BtnIconToggle>
          <p className="text-sm">{like}</p>
        </div>
        <div className="flex items-center space-x-3">
          <BtnIcon variant="tertiary" size="sm" iconName="Comment" />
          <p className="text-sm">{comment}</p>
        </div>
        <div className="flex items-center space-x-3">
          <BtnIcon variant="tertiary" size="sm" iconName="Share" />
          <p className="text-sm">{share}</p>
        </div>
      </div>
    </div>
  );
}
