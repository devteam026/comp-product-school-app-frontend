import { cookies } from "next/headers";
import HomeShell from "./HomeShell";

export default async function HomePage() {
  const session = (await cookies()).get("session");
  const [role = "user", encodedName = "user"] = session?.value.split(":") ?? [];
  const username = decodeURIComponent(encodedName);
  const displayRole = role.charAt(0).toUpperCase() + role.slice(1);

  return <HomeShell displayRole={displayRole} username={username} />;
}
