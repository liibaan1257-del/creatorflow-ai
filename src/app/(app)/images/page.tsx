import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/coming-soon";
import { ImageIcon } from "@/components/ui/icons";

export const metadata: Metadata = { title: "AI Images" };

export default function ImagesPage() {
  return (
    <ComingSoon
      title="AI Images"
      description="Thumbnails, featured images and social graphics."
      icon={<ImageIcon />}
      details="The AI Image Generator is in development. Generated images will be stored privately in your account."
    />
  );
}
