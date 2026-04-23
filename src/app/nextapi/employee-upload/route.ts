import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://127.0.0.1:8081";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("Authorization") ?? "";
  const url = new URL(request.url);
  const endpoint = url.searchParams.get("endpoint");

  if (endpoint !== "photo" && endpoint !== "doc") {
    return NextResponse.json({ error: "Invalid endpoint" }, { status: 400 });
  }

  const backendPath =
    endpoint === "photo"
      ? "/api/employees/photo-upload"
      : "/api/employees/doc-upload";

  const body = await request.arrayBuffer();
  const contentType = request.headers.get("Content-Type") ?? "";

  const backendResponse = await fetch(`${BACKEND_URL}${backendPath}`, {
    method: "POST",
    headers: {
      "Content-Type": contentType,
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
    body: Buffer.from(body),
  });

  const data = await backendResponse.json().catch(() => null);
  return NextResponse.json(data ?? { error: "Upload failed" }, {
    status: backendResponse.status,
  });
}

export const config = {
  api: {
    bodyParser: false,
  },
};
