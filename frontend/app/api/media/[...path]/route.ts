import { NextRequest, NextResponse } from "next/server";

const DJANGO_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  if (
    !path.length ||
    path.some(
      (segment) =>
        !segment ||
        segment === "." ||
        segment === ".." ||
        segment.includes("/") ||
        segment.includes("\\") ||
        segment.includes("\0")
    )
  ) {
    return new NextResponse("Invalid media path", { status: 400 });
  }

  const base = DJANGO_BASE.endsWith("/") ? DJANGO_BASE : `${DJANGO_BASE}/`;
  const mediaPath = path.map(encodeURIComponent).join("/");
  const djangoUrl = new URL(`media/${mediaPath}`, base);

  try {
    const response = await fetch(djangoUrl, { redirect: "error" });
    if (!response.ok) {
      return new NextResponse("Not found", { status: 404 });
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.toLowerCase().startsWith("image/")) {
      return new NextResponse("Unsupported media type", { status: 415 });
    }
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("Error fetching media", { status: 500 });
  }
}
