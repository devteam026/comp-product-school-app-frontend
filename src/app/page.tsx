import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function IndexPage() {
  const session = (await cookies()).get("session");

  if (session) {
    redirect("/home");
  }

  redirect("/login");
}
