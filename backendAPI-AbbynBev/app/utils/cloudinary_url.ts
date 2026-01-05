import cloudinary from "#config/cloudinary"

export function cloudinaryImageUrl(publicId: string, width = 120) {
  return cloudinary.url(publicId, {
    secure: true,
    transformation: [
      { width, crop: 'scale' },
      { fetch_format: 'auto', quality: 'auto' },
    ],
  })
}