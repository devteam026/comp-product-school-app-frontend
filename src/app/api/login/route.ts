import { NextResponse } from "next/server";
import { teacherClasses } from "../../home/data";

const ALLOWED_ROLES = ["admin", "teacher", "parent", "student", "accountant"] as const;
const DEMO_PASSWORD = "password";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (
    !body ||
    typeof body.username !== "string" ||
    typeof body.password !== "string" ||
    typeof body.role !== "string" ||
    typeof body.classCode !== "string"
  ) {
    return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
  }

  const { username, password, role, classCode } = body as {
    username: string;
    password: string;
    role: string;
    classCode: string;
  };

  const normalizedRole = role.toLowerCase();
  const normalizedUsername = username.trim().toLowerCase();
  const isAllowedRole = (ALLOWED_ROLES as readonly string[]).includes(normalizedRole);

  if (!isAllowedRole || normalizedUsername.length === 0 || password !== DEMO_PASSWORD) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  if (normalizedRole === "teacher" && classCode) {
    const classes = teacherClasses[normalizedUsername] ?? [];
    if (!classes.includes(classCode)) {
      return NextResponse.json(
        { error: "Select a class assigned to this teacher" },
        { status: 401 }
      );
    }
  }

  const sessionValue =
    normalizedRole === "teacher" && classCode
      ? `${normalizedRole}:${normalizedUsername}:${classCode}`
      : `${normalizedRole}:${normalizedUsername}`;

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: "session",
    value: sessionValue,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return response;
}
