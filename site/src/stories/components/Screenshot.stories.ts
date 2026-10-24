import Screenshot from "@/src/components/Screenshot.astro";

export default {
  title: "Components/Screenshot",
  component: Screenshot,
};

export const Kanban = { args: { view: "kanban", alt: "Trekker dashboard kanban board" } };

export const Comments = { args: { view: "comments", alt: "Task comments left by agents" } };
