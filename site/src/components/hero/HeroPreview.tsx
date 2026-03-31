import { ImagePreview } from "../shared/ImagePreview";

export function HeroPreview() {
  return (
    <div className="hero-preview">
      <ImagePreview
        src="/trekker/images/dashboard-kanban.png"
        alt="Trekker dashboard kanban board"
      />
    </div>
  );
}
