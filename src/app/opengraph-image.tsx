import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

/** Default social preview image (Open Graph + Twitter) for every page. */
export const alt = `${siteConfig.name} — ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #0a0d14 0%, #1c1f3d 100%)",
          color: "#e6e9f0",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 16,
              background: "#818cf8",
              color: "#0a0d14",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 32,
              fontWeight: 700,
            }}
          >
            CF
          </div>
          <div style={{ fontSize: 40, fontWeight: 700 }}>{siteConfig.name}</div>
        </div>
        <div style={{ marginTop: 56, fontSize: 76, fontWeight: 700, lineHeight: 1.1, display: "flex", flexWrap: "wrap" }}>
          Create Better Content.&nbsp;<span style={{ color: "#818cf8" }}>Faster.</span>
        </div>
        <div style={{ marginTop: 28, fontSize: 32, color: "#949db0", maxWidth: 900 }}>
          AI-powered tools for bloggers, creators, freelancers, and small businesses.
        </div>
      </div>
    ),
    size,
  );
}
