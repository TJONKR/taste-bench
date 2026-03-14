import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";
import { getScore } from "@/lib/leaderboard";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const data = await getScore(params.slug);

  if (!data) {
    return new Response("Not found", { status: 404 });
  }
  const score = Math.round(data.score);
  const dims = Object.entries(data.dimensions) as [string, { score: number; level: string }][];

  // Score color
  const scoreColor =
    score >= 80 ? "#4a7c59" :
    score >= 60 ? "#b8860b" :
    score >= 40 ? "#c45d3e" :
    "#8b4049";

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200",
          height: "630",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#f5f0e8",
          fontFamily: "Georgia, serif",
          padding: "48px 56px",
          position: "relative",
        }}
      >
        {/* Top bar */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "32px",
        }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{
              fontSize: "11px",
              letterSpacing: "3px",
              textTransform: "uppercase" as const,
              color: "#a09888",
              fontFamily: "sans-serif",
            }}>
              THE TASTE BENCH
            </span>
          </div>
          <span style={{
            fontSize: "11px",
            letterSpacing: "2px",
            textTransform: "uppercase" as const,
            color: "#a09888",
            fontFamily: "sans-serif",
          }}>
            tastebench.ai
          </span>
        </div>

        {/* Main content */}
        <div style={{
          display: "flex",
          flex: 1,
          gap: "48px",
          alignItems: "center",
        }}>
          {/* Left: Avatar + Score */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
            minWidth: "200px",
          }}>
            {data.avatarUrl && (
              <img
                src={data.avatarUrl}
                width="96"
                height="96"
                style={{
                  borderRadius: "50%",
                  border: "2px solid #d5cdc0",
                }}
              />
            )}
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}>
              <span style={{
                fontSize: "64px",
                fontWeight: "bold",
                color: scoreColor,
                lineHeight: 1,
              }}>
                {score}
              </span>
              <span style={{
                fontSize: "13px",
                color: "#a09888",
                fontFamily: "sans-serif",
                marginTop: "4px",
              }}>
                / 100
              </span>
            </div>
          </div>

          {/* Right: Name + Title + Dimensions */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            gap: "20px",
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{
                fontSize: "36px",
                fontWeight: "bold",
                color: "#2c2825",
                lineHeight: 1.2,
              }}>
                {data.name}
              </span>
              <span style={{
                fontSize: "18px",
                fontStyle: "italic",
                color: "#7a7068",
              }}>
                &ldquo;{data.title}&rdquo;
              </span>
              {data.overallLevel && (
                <span style={{
                  fontSize: "13px",
                  color: "#c45d3e",
                  fontFamily: "sans-serif",
                  fontWeight: 500,
                }}>
                  {data.overallLevel}
                </span>
              )}
            </div>

            {/* Dimension bars */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              marginTop: "8px",
            }}>
              {dims.map(([key, dim]) => (
                <div key={key} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}>
                  <span style={{
                    fontSize: "11px",
                    color: "#a09888",
                    fontFamily: "sans-serif",
                    textTransform: "uppercase" as const,
                    letterSpacing: "1px",
                    width: "120px",
                    textAlign: "right" as const,
                  }}>
                    {key}
                  </span>
                  <div style={{
                    flex: 1,
                    height: "8px",
                    backgroundColor: "#e8e2d6",
                    borderRadius: "4px",
                    display: "flex",
                  }}>
                    <div style={{
                      width: `${dim.score}%`,
                      height: "8px",
                      backgroundColor: scoreColor,
                      borderRadius: "4px",
                      opacity: 0.7,
                    }} />
                  </div>
                  <span style={{
                    fontSize: "12px",
                    color: "#7a7068",
                    fontFamily: "sans-serif",
                    width: "32px",
                  }}>
                    {Math.round(dim.score)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          marginTop: "24px",
          borderTop: "1px solid #d5cdc0",
          paddingTop: "16px",
        }}>
          <span style={{
            fontSize: "12px",
            color: "#b8ad9e",
            fontFamily: "sans-serif",
            letterSpacing: "1px",
          }}>
            AI-powered taste evaluation — tastebench.ai/p/{params.slug}
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
