interface ScreenshotsProps {
  images: { src: string; alt: string }[];
}

export function Screenshots({ images }: ScreenshotsProps) {
  return (
    <div className="flex flex-col md:flex-row gap-2 overflow-x-auto">
      {images.map((image, index) => (
        <img
          key={index}
          src={image.src}
          alt={image.alt}
          className="w-full max-md:rounded-none border border-neutral-200 dark:border-neutral-800 max-md:border-x-0 max-w-3xl"
        />
      ))}
    </div>
  );
}
