"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../styles/login.module.css";
import { teacherClasses } from "../home/data";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("admin");
  const [classCode, setClassCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const availableClasses = useMemo(() => {
    if (role !== "teacher") return [];
    const key = username.trim().toLowerCase();
    return teacherClasses[key] ?? [];
  }, [role, username]);

  useEffect(() => {
    if (role !== "teacher") return;
    if (availableClasses.length === 0) {
      setClassCode("");
      return;
    }
    setClassCode((prev) => (prev ? prev : availableClasses[0]));
  }, [role, availableClasses]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role, classCode }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error ?? "Invalid credentials");
      }

      router.push("/home");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div>
          <h1 className={styles.title}>Welcome back</h1>
          <p className={styles.subtitle}>Sign in to continue to your home page.</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.label}>
            Login as
            <select
              className={styles.input}
              name="role"
              value={role}
              onChange={(event) => {
                setRole(event.target.value);
                setClassCode("");
              }}
              required
            >
              <option value="admin">Admin</option>
              <option value="teacher">Teacher</option>
              <option value="parent">Parent</option>
              <option value="student">Student</option>
              <option value="accountant">Accountant</option>
            </select>
          </label>

          <label className={styles.label}>
            Username
            <input
              className={styles.input}
              type="text"
              name="username"
              autoComplete="username"
              value={username}
              onChange={(event) => {
                setUsername(event.target.value);
                setClassCode("");
              }}
              required
            />
          </label>

          {role === "teacher" ? (
            <label className={styles.label}>
              Class (Assigned)
              <select
                className={styles.input}
                value={classCode}
                onChange={(event) => setClassCode(event.target.value)}
                required
                disabled={availableClasses.length === 0}
              >
                {availableClasses.length === 0 ? (
                  <option value="" disabled>
                    No classes found
                  </option>
                ) : null}
                {availableClasses.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label className={styles.label}>
            Password
            <input
              className={styles.input}
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          {error ? <div className={styles.error}>{error}</div> : null}

          <button className={styles.button} type="submit" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className={styles.hint}>
          Demo password: <strong>password</strong>
        </p>
      </div>
    </div>
  );
}
