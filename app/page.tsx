import { pageMetadata } from "@/lib/seo";
import { HomePage } from "@/components/home-page";

export const metadata = pageMetadata("/");

export default function Home() {
  return <HomePage />;
}
