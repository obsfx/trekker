import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ScreenshotsProps {
  images: { src: string; alt: string }[];
}

export function Screenshots({ images }: ScreenshotsProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const goToPrev = () => {
    setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="py-4">
      {/* Main image display */}
      <div className="relative">
        <figure className="overflow-hidden rounded-lg max-md:rounded-none max-md:-mx-4">
          <img
            src={images[activeIndex].src}
            alt={images[activeIndex].alt}
            loading="lazy"
            className="w-full"
          />
        </figure>

        {/* Navigation arrows */}
        <button
          onClick={goToPrev}
          aria-label="Previous image"
          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={goToNext}
          aria-label="Next image"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Caption */}
      <p className="mt-4 text-fluid-sm text-white/60 text-center">
        {images[activeIndex].alt}
      </p>

      {/* Thumbnail navigation */}
      <div className="flex justify-center gap-3 mt-4">
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => setActiveIndex(index)}
            aria-label={`View ${image.alt}`}
            className={`w-20 h-14 rounded overflow-hidden transition-all ${
              index === activeIndex
                ? "ring-2 ring-white"
                : "opacity-50 hover:opacity-100"
            }`}
          >
            <img
              src={image.src}
              alt=""
              className="w-full h-full object-cover object-left-top"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
