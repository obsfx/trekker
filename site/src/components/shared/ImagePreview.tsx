interface ImagePreviewProps {
  src: string;
  alt: string;
  compact?: boolean;
}

export function ImagePreview({
  src,
  alt,
  compact = false,
}: ImagePreviewProps) {
  return (
    <div className={`image-frame${compact ? " compact" : ""}`}>
      <img src={src} alt={alt} className="content-shot" />
    </div>
  );
}
