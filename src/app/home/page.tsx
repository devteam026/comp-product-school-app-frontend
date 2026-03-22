"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import HomeShell from "./HomeShell";

type StoredProfile = {
  username?: string;
  displayName?: string;
  role?: string;
  classCode?: string;
};

export default function HomePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<StoredProfile | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem("userProfile");
    const token = window.localStorage.getItem("authToken");
    if (!stored || !token) {
      router.replace("/login");
      return;
    }
    try {
      const parsed = JSON.parse(stored) as StoredProfile;
      setProfile(parsed);
    } catch {
      router.replace("/login");
    }
  }, [router]);

  if (!profile) {
    return null;
  }

  const role = profile.role ?? "user";
  const username = profile.username ?? profile.displayName ?? "user";
  const classCode = profile.classCode;
  const displayRole = role.charAt(0).toUpperCase() + role.slice(1);

  return (
    <HomeShell displayRole={displayRole} username={username} classCode={classCode} />
  );
}
