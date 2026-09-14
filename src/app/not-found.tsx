import type { Metadata } from "next";
import StorefrontErrorState from "@/components/organisms/StorefrontErrorState";

export const metadata: Metadata = {
  title: "Сторінку не знайдено",
};

export default function NotFound() {
  return <StorefrontErrorState kind="not-found" />;
}
