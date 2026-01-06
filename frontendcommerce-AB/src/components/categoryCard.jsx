"use client";

const DEFAULT_CLOUD_NAME = "abbymedia";
const PLACEHOLDER_PUBLIC_ID = "/v1767525417/placeholder-category.png";

function normalizePublicId(value) {
  return String(value ?? "")
    .trim()
    .replace(/^\/+/, "")                 
    .replace(/\.(png|jpg|jpeg|webp)$/i, "");
}

function cloudinaryUrl({ cloudName, publicId, width = 120 }) {
  const cn = cloudName || DEFAULT_CLOUD_NAME;
  const pid = normalizePublicId(publicId) || PLACEHOLDER_PUBLIC_ID;

  return `https://res.cloudinary.com/${cn}/image/upload/f_auto,q_auto,w_${width}/${pid}`;
}

export function CategoryCard({
  name,
  title,
  iconPublicId,
  icon_public_id,
  cloudName,
}) {
  const label = title ?? name ?? "";
  const publicId = iconPublicId ?? icon_public_id ?? "";

  const src = cloudinaryUrl({ cloudName: cloudName || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, publicId });

  return (
    <div className="group w-full min-w-[80px] flex flex-col items-center justify-center rounded-xl p-2 space-y-2 cursor-pointer">
      <img
        src={src}
        alt={label}
        className="mx-auto h-[32px] w-[32px] lg:h-[50px] w-[50px] object-contain
                   transition-transform duration-200
                   lg:group-hover:-translate-y-1 lg:group-hover:scale-105"
        onError={(e) => {
          // anti-loop: fallback cuma sekali
          if (e.currentTarget.dataset.fallback === "1") return;
          e.currentTarget.dataset.fallback = "1";

          e.currentTarget.src = cloudinaryUrl({
            cloudName: cloudName || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
            publicId: PLACEHOLDER_PUBLIC_ID,
          });
        }}
        loading="lazy"
        decoding="async"
      />

      <h3 className="text-center font-normal text-xs lg:text-sm text-primary-700">
        {label}
      </h3>
    </div>
  );
}