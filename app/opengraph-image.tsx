import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { site } from "@/content/site";
import { openGraphCopy } from "@/content/seo";

export const alt = openGraphCopy.alt;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-static";

export default async function OpenGraphImage() {
  const [css, font, logo] = await Promise.all([
    readFile(path.join(process.cwd(), "app/globals.css"), "utf8"),
    readFile(path.join(process.cwd(), "assets/fonts/Manrope-Bold.ttf")),
    readFile(path.join(process.cwd(), "public/logo.png")),
  ]);
  // Read @theme directly so the share image cannot drift from the site palette.
  const token = (name: string) => {
    const value = css.match(new RegExp(`--${name}:\\s*([^;]+);`))?.[1]?.trim();
    if (!value) throw new Error(`Missing Open Graph theme token: ${name}`);
    return value;
  };
  const spacing = parseFloat(token("spacing")) * 16;
  return new ImageResponse(
    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", fontFamily: "Manrope", background: token("color-clear-white"), color: token("color-sign-black") }}>
      <div style={{ display: "flex", alignItems: "center", padding: `${spacing * 6}px ${spacing * 16}px`, background: token("color-sign-black") }}>
        {/* The supplied logo is embedded whole, with its original proportions. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`data:image/png;base64,${logo.toString("base64")}`} width={320} alt={site.name} />
      </div>
      <div style={{ display: "flex", flex: 1, flexDirection: "column", justifyContent: "center", padding: `${spacing * 8}px ${spacing * 16}px`, gap: spacing * 6 }}>
        <div style={{ fontSize: 72, lineHeight: parseFloat(token("text-display--line-height")), letterSpacing: token("text-display--letter-spacing"), fontWeight: 700, maxWidth: 900 }}>{openGraphCopy.title}</div>
        <div style={{ fontSize: 30, color: token("color-slate") }}>{openGraphCopy.location}</div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", padding: `${spacing * 6}px ${spacing * 16}px`, background: token("color-logo-blue"), color: token("color-clear-white"), fontSize: 28 }}>
        <span>{site.phone}</span><span>{new URL(site.canonicalUrl).hostname}</span>
      </div>
    </div>,
    { ...size, fonts: [{ name: "Manrope", data: font, weight: 700, style: "normal" }] },
  );
}
