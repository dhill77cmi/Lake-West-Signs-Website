import { notFound } from "next/navigation";
import { HomePage } from "@/components/home-page";

export const metadata = { title: "Hero design options | Lake West Signs", robots: { index: false, follow: false } };

export function generateStaticParams() {
  return [{ layout: "full-screen" }, { layout: "half-screen" }];
}

export default async function DesignOption({ params }: { params: Promise<{ layout: string }> }) {
  const { layout } = await params;
  if (layout !== "full-screen" && layout !== "half-screen") notFound();
  return <HomePage heroLayout={layout === "full-screen" ? "full" : "split"} />;
}
