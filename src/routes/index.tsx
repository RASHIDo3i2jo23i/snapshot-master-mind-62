import { createFileRoute } from "@tanstack/react-router";
import AsykGame from "@/components/AsykGame";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Асық ату — казахская народная игра онлайн" },
      {
        name: "description",
        content:
          "Асық ату: бросай сақа по дуге, выбивай асыки за круг и набирай очки. Казахская традиционная игра в браузере — три языка, рекорды и звук.",
      },
      { property: "og:title", content: "Асық ату — казахская народная игра онлайн" },
      {
        property: "og:description",
        content:
          "Навесной бросок сақа, золотой асык за +300 очков, рекорды и казахский орнамент. Играй прямо в браузере.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AsykGame,
});
