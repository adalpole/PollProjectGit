import { ImageResponse } from "next/og";

export const alt = "PoliPol scheduling poll preview";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "linear-gradient(135deg, #07182f 0%, #102c53 48%, #0ba4ff 100%)",
          color: "#ffffff",
          display: "flex",
          fontFamily: "Arial, Helvetica, sans-serif",
          height: "100%",
          justifyContent: "center",
          padding: 72,
          width: "100%",
        }}
      >
        <div
          style={{
            alignItems: "flex-start",
            border: "1px solid rgba(255, 255, 255, 0.22)",
            borderRadius: 28,
            display: "flex",
            flexDirection: "column",
            gap: 28,
            height: "100%",
            justifyContent: "space-between",
            padding: 52,
            width: "100%",
          }}
        >
          <div style={{ alignItems: "center", display: "flex", gap: 24 }}>
            <div
              style={{
                alignItems: "center",
                background: "#07182f",
                border: "1px solid rgba(77, 201, 255, 0.5)",
                borderRadius: 22,
                boxShadow: "0 0 40px rgba(77, 201, 255, 0.35)",
                color: "#4dc9ff",
                display: "flex",
                fontSize: 42,
                fontWeight: 800,
                height: 104,
                justifyContent: "center",
                letterSpacing: 0,
                width: 104,
              }}
            >
              PP
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontSize: 58, fontWeight: 700, letterSpacing: 0 }}>PoliPol</div>
              <div style={{ color: "#bcecff", fontSize: 25, fontWeight: 700 }}>
                Lightweight scheduling polls
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ fontSize: 56, fontWeight: 700, letterSpacing: 0, maxWidth: 870 }}>
              Find a time everyone keeps.
            </div>
            <div style={{ color: "#d8f4ff", fontSize: 30, lineHeight: 1.32, maxWidth: 850 }}>
              Share one link, collect availability, and select the best slot without accounts.
            </div>
          </div>

          <div style={{ alignItems: "center", display: "flex", gap: 14 }}>
            <div style={{ background: "#0ba4ff", borderRadius: 999, height: 14, width: 128 }} />
            <div style={{ background: "#9ee6ad", borderRadius: 999, height: 14, width: 88 }} />
            <div
              style={{
                background: "#ffffff",
                borderRadius: 999,
                height: 14,
                opacity: 0.78,
                width: 62,
              }}
            />
          </div>
        </div>
      </div>
    ),
    size,
  );
}
