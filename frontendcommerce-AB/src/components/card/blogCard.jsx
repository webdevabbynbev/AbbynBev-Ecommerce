"use client";

import { BtnIcon, BtnIconToggle } from "..";
import { formatDistanceToNow } from "date-fns";
import { FaNewspaper } from "react-icons/fa6";

export function BlogCard({
  createdAt,
  image,
  imgTitle,
  title,
  category,
  article,
  like = null,
  comment = null,
  share = null,
}) {
  return (
    <div
      className="flex flex-col bg-primary-50 p-4 w-full space-y-4 rounded-3xl shadow-sm
                 hover:-translate-y-0.5 hover:outline hover:outline-1
                 outline-primary-300 transition-all duration-300 cursor-pointer"
    >
      {/* HEADER */}
      <div className="flex justify-between">
        <div className="flex space-x-2 items-center text-sm">
          <span>Abby n Bev</span>
          <div className="w-1 h-1 rounded-full bg-neutral-400"></div>
          {createdAt && (
            <span className="text-neutral-400">
              {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
            </span>
          )}
        </div>
      </div>

      {/* CONTENT */}
      <div className="space-y-3">
        {image && (
          <img
            src={image}
            alt={imgTitle}
            className="rounded-lg w-full object-cover"
          />
        )}

        {category && (
          <div className="flex items-center space-x-2">
            <span className="rounded-lg text-xs px-3 py-1
                             text-primary-700 bg-primary-100 font-bold">
              {category}
            </span>
          </div>
        )}

        <h1
          className="text-sm font-bold text-primary-700"
          dangerouslySetInnerHTML={{ __html: title }}
        />

        <div className="text-sm line-clamp-2"
             dangerouslySetInnerHTML={{ __html: article }} />
      </div>

      {/* FOOTER ACTIONS (OPTIONAL) */}
      {(like !== null || comment !== null || share !== null) && (
        <div className="flex space-x-4 pt-2">
          {like !== null && (
            <div className="flex items-center space-x-2">
              <BtnIconToggle variant="tertiary" size="sm" iconName="ThumbsUp" />
              <span className="text-sm">{like}</span>
            </div>
          )}

          {comment !== null && (
            <div className="flex items-center space-x-2">
              <BtnIcon variant="tertiary" size="sm" iconName="Comment" />
              <span className="text-sm">{comment}</span>
            </div>
          )}

          {share !== null && (
            <div className="flex items-center space-x-2">
              <BtnIcon variant="tertiary" size="sm" iconName="Share" />
              <span className="text-sm">{share}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
