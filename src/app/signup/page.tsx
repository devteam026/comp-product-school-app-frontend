"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../styles/login.module.css";
import { apiUrl } from "../../lib/api";

const roles = [
  { value: "student", label: "👨‍🎓 Student" },
  { value: "parent", label: "👨‍👩‍👧 Parent" },
  { value: "teacher", label: "👩‍🏫 Teacher" },
  { value: "accountant", label: "💰 Accountant" },
  { value: "admin", label: "🏫 Admin" },
];

export default function SignupPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("student");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(apiUrl("/api/auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, username, role, password }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error ?? "Sign up failed");
      }

      router.push("/login");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign up failed";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        <section className={styles.infoPanel}>
          <div>
            <h1 className={styles.title}>Create your account</h1>
            <p className={styles.subtitle}>
              Register once, then use your credentials to sign in.
            </p>
          </div>
        </section>

        <div className={styles.card}>
          <div>
            <h1 className={styles.title}>Sign up</h1>
            <p className={styles.subtitle}>Fill in your details below.</p>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <label className={styles.label}>
              Full Name
              <input
                className={styles.input}
                type="text"
                name="displayName"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                required
              />
            </label>

            <label className={styles.label}>
              Username
              <input
                className={styles.input}
                type="text"
                name="username"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
              />
            </label>

            <label className={styles.label}>
              Role
              <select
                className={styles.input}
                name="role"
                value={role}
                onChange={(event) => setRole(event.target.value)}
                required
              >
                {roles.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.label}>
              Password
              <input
                className={styles.input}
                type="password"
                name="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>

            {error ? <div className={styles.error}>{error}</div> : null}

            <button className={styles.button} type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}