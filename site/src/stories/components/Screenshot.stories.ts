import Screenshot from "@/src/components/Screenshot.astro";

export default {
  title: "Components/Screenshot",
  component: Screenshot,
};

export const Board = { args: { view: "board", alt: "Trekker web UI board" } };

export const Comments = { args: { view: "comments", alt: "Task comments left by agents" } };
