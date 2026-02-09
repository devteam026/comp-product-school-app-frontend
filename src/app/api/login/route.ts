import { NextResponse } from "next/server";

const ALLOWED_ROLES = ["admin", "teacher", "parent", "student", "accountant"] as const;
const DEMO_PASSWORD = "password";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (
    !body ||
    typeof body.username !== "string" ||
    typeof body.password !== "string" ||
    typeof body.role !== "string"
  ) {
    return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
  }

  const { username, password, role } = body as {
    username: string;
    password: string;
    role: string;
  };

  const normalizedRole = role.toLowerCase();
  const normalizedUsername = username.trim();
  const isAllowedRole = (ALLOWED_ROLES as readonly string[]).includes(normalizedRole);

  if (!isAllowedRole || normalizedUsername.length === 0 || password !== DEMO_PASSWORD) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: "session",
    value: `${normalizedRole}:${encodeURIComponent(normalizedUsername)}`,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return response;
}
