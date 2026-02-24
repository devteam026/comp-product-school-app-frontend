"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../styles/login.module.css";
import { apiUrl } from "../../lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [schoolName, setSchoolName] = useState("Sunrise Public School");
  const [about, setAbout] = useState(
    "Sunrise Public School blends academic excellence with character development, giving every learner a safe, inspiring place to grow."
  );
  const [mission, setMission] = useState(
    "To empower every student through inclusive teaching, creative exploration, and a strong sense of community."
  );
  const [vision, setVision] = useState(
    "A future where confident, curious, and compassionate learners lead positive change."
  );
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [campusImageUrl, setCampusImageUrl] = useState<string | null>(null);
  const [schoolUrl, setSchoolUrl] = useState<string | null>(null);
  const [isInfoLoading, setIsInfoLoading] = useState(true);
  const [showNoClassModal, setShowNoClassModal] = useState(false);

  useEffect(() => {
    let isActive = true;
    setIsInfoLoading(true);
    fetch(apiUrl("/api/school"))
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isActive || !data) return;
        setSchoolName(data.schoolName || schoolName);
        setAbout(data.about || about);
        setMission(data.mission || mission);
        setVision(data.vision || vision);
        setLogoUrl(data.logoUrl || null);
        setCampusImageUrl(data.campusImageUrl || null);
        setSchoolUrl(data.schoolUrl || null);
      })
      .catch(() => {
        // keep defaults on failure
      })
      .finally(() => {
        if (isActive) setIsInfoLoading(false);
      });
    return () => {
      isActive = false;
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(apiUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role, classCode: "" }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error ?? "Invalid credentials");
      }

      const data = await response.json().catch(() => null);
      if (data?.token) {
        window.localStorage.setItem("authToken", data.token);
        window.localStorage.setItem("userProfile", JSON.stringify(data.user ?? {}));
      }

      if (role === "teacher" && data?.user?.username) {
        const token = data?.token as string | undefined;
        const classResponse = await fetch(
          apiUrl(`/api/classes/teacher/${encodeURIComponent(data.user.username)}`),
          {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          }
        );
        if (classResponse.ok) {
          const classes = (await classResponse.json()) as string[];
          if (!classes || classes.length === 0) {
            setShowNoClassModal(true);
            return;
          }
        }
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
    <div
      className={styles.page}
      style={
        campusImageUrl
          ? {
              backgroundImage: `linear-gradient(135deg, rgba(255, 247, 240, 0.78) 0%, rgba(245, 251, 255, 0.78) 100%), url("${campusImageUrl}")`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
    >
      <div className={styles.layout}>
        <section className={styles.infoPanel}>
          <div className={styles.brandRow}>
            {isInfoLoading ? (
              <div className={styles.logoSkeleton} />
            ) : logoUrl ? (
              <img className={styles.logoImage} src={logoUrl} alt={`${schoolName} logo`} />
            ) : (
              <div className={styles.logo}>SP</div>
            )}
            <div>
              {isInfoLoading ? (
                <>
                  <div className={styles.textSkeleton} />
                  <div className={styles.textSkeletonSmall} />
                </>
              ) : (
                <>
                  <p className={styles.schoolName}>{schoolName}</p>
                  <p className={styles.tagline}>Learning with purpose. Leading with care.</p>
                </>
              )}
            </div>
          </div>

          <div className={styles.infoBlocks}>
            <div>
              <h2 className={styles.infoTitle}>About Our School</h2>
              <p className={styles.infoText}>
                {isInfoLoading ? "Loading school details..." : about}
              </p>
            </div>
            <div>
              <h3 className={styles.infoSubtitle}>Our Mission</h3>
              <p className={styles.infoText}>
                {isInfoLoading ? "Loading mission..." : mission}
              </p>
            </div>
            <div>
              <h3 className={styles.infoSubtitle}>Our Vision</h3>
              <p className={styles.infoText}>
                {isInfoLoading ? "Loading vision..." : vision}
              </p>
            </div>
          </div>

          <div className={styles.ctaRow}>
            <a
              className={`${styles.ctaButton} ${!schoolUrl ? styles.ctaDisabled : ""}`}
              href={schoolUrl ? `${schoolUrl.replace(/\/$/, "")}/` : undefined}
              target={schoolUrl ? "_blank" : undefined}
              rel={schoolUrl ? "noreferrer" : undefined}
              aria-disabled={!schoolUrl}
              tabIndex={!schoolUrl ? -1 : 0}
            >
              ✅ Apply Now
            </a>
            <a
              className={`${styles.ctaButtonAlt} ${!schoolUrl ? styles.ctaDisabled : ""}`}
              href={schoolUrl ? `${schoolUrl.replace(/\/$/, "")}/` : undefined}
              target={schoolUrl ? "_blank" : undefined}
              rel={schoolUrl ? "noreferrer" : undefined}
              aria-disabled={!schoolUrl}
              tabIndex={!schoolUrl ? -1 : 0}
            >
              ✅ Enquiry
            </a>
          </div>
        </section>

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
                }}
                required
              >
                <option value="student">👨‍🎓 Student Login</option>
                <option value="parent">👨‍👩‍👧 Parent Login</option>
                <option value="teacher">👩‍🏫 Teacher Login</option>
                <option value="accountant">💰 Accountant Login</option>
                <option value="admin">🏫 Admin Login</option>
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
              }}
              required
            />
            </label>

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

          <p className={styles.hint}>Use your official credentials to sign in.</p>
        </div>
      </div>
      {showNoClassModal ? (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <div>
                <h3>No classes assigned</h3>
                <p className={styles.modalSubtitle}>
                  Please contact the admin to assign a class to your account.
                </p>
              </div>
            </div>
            <div className={styles.modalBody}>
              You can’t access the dashboard until a class is assigned.
            </div>
            <button
              className={styles.inlineButton}
              type="button"
              onClick={() => setShowNoClassModal(false)}
            >
              OK
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
