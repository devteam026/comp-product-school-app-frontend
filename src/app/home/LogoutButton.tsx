"use client";

import { useRouter } from "next/navigation";

type LogoutButtonProps = {
  className?: string;
};

export default function LogoutButton({ className }: LogoutButtonProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <button type="button" onClick={handleLogout} className={className}>
      Log out
    </button>
  );
}
