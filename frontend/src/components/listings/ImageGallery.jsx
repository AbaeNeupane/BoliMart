import { useState } from "react"

const getImageUrl = (url) =>
  !url ? "" : url.startsWith("http") ? url : `http://localhost:8000${url}`

export default function ImageGallery({ images = [] }) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const image = getImageUrl(images[selectedIndex])

  if (!images.length) {
    return (
      <div className="w-full aspect-square bg-gray-100 rounded-2xl flex items-center justify-center text-gray-300 text-6xl">
        📷
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden flex items-center justify-center">
        <img src={image} alt="Product" className="w-full h-full object-cover" />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setSelectedIndex(i)}
              className={`w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                i === selectedIndex ? "border-primary-500" : "border-gray-200"
              }`}
            >
              <img src={getImageUrl(img)} alt={`Thumbnail ${i}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}