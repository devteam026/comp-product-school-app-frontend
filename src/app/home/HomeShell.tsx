"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "../styles/home.module.css";
import LogoutButton from "./LogoutButton";
import StudentManagement from "./StudentManagement";
import AttendanceManagement from "./AttendanceManagement";
import HomeDashboard from "./HomeDashboard";
import { filterStudents, seedStudents, teacherClasses, type Student } from "./data";

const menuItems = [
  "Home",
  "Student Management",
  "Attendance Management",
] as const;

type MenuItem = (typeof menuItems)[number];

type HomeShellProps = {
  displayRole: string;
  username: string;
  classCode?: string;
};

export default function HomeShell({
  displayRole,
  username,
  classCode,
}: HomeShellProps) {
  const [activeItem, setActiveItem] = useState<MenuItem>("Home");
  const [students, setStudents] = useState<Student[]>(seedStudents);

  const role = displayRole.toLowerCase();
  const adminClassOptions = useMemo(
    () => Array.from(new Set(students.map((student) => student.classCode))).sort(),
    [students]
  );
  const teacherOptions = teacherClasses[username.toLowerCase()] ?? [];
  const initialClassSelection =
    role === "admin"
      ? "all"
      : classCode && teacherOptions.includes(classCode)
        ? classCode
        : teacherOptions[0] ?? "";
  const [activeClass, setActiveClass] = useState(initialClassSelection);

  const visibleStudents = useMemo(
    () => filterStudents(students, role, username, activeClass),
    [students, role, username, activeClass]
  );

  const subtitleMap: Record<MenuItem, string> = {
    Home: "School overview for the day and month.",
    "Student Management": "Add and track students in one place.",
    "Attendance Management": "Track daily attendance for each class.",
  };

  const handleAddStudent = (student: Student) => {
    setStudents((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === student.id);
      if (existingIndex === -1) {
        return [student, ...prev];
      }
      const updated = [...prev];
      updated[existingIndex] = student;
      return updated;
    });
  };

  useEffect(() => {
    const stored = window.localStorage.getItem("students");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Student[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setStudents(parsed);
        }
      } catch {
        // ignore bad data
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("students", JSON.stringify(students));
  }, [students]);

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <div>
            <div className={styles.brand}>School Portal</div>
            <div className={styles.user}>
              {displayRole} · {username}
            </div>
            {role === "teacher" && activeClass ? (
              <div className={styles.user}>Class {activeClass}</div>
            ) : null}
          </div>

          <nav className={styles.nav}>
            {menuItems.map((item) => (
              <button
                key={item}
                className={`${styles.navItem} ${
                  item === activeItem ? styles.navItemActive : ""
                }`}
                type="button"
                onClick={() => setActiveItem(item)}
              >
                {item}
              </button>
            ))}
          </nav>
        </aside>

        <main className={styles.content}>
          <header className={styles.header}>
            <div>
              <h1 className={styles.title}>{activeItem}</h1>
              <p className={styles.subtitle}>{subtitleMap[activeItem]}</p>
            </div>
            <div className={styles.headerActions}>
              {role === "admin" ? (
                <label className={styles.inlineLabel}>
                  Class
                  <select
                    className={styles.inlineSelect}
                    value={activeClass}
                    onChange={(event) => setActiveClass(event.target.value)}
                  >
                    <option value="all">All</option>
                    {adminClassOptions.map((code) => (
                      <option key={code} value={code}>
                        {code}
                      </option>
                    ))}
                  </select>
                </label>
              ) : role === "teacher" ? (
                <label className={styles.inlineLabel}>
                  Class
                  <select
                    className={styles.inlineSelect}
                    value={activeClass}
                    onChange={(event) => setActiveClass(event.target.value)}
                    disabled={teacherOptions.length === 0}
                  >
                    {teacherOptions.length === 0 ? (
                      <option value="" disabled>
                        No classes
                      </option>
                    ) : (
                      teacherOptions.map((code) => (
                        <option key={code} value={code}>
                          {code}
                        </option>
                      ))
                    )}
                  </select>
                </label>
              ) : null}
              <LogoutButton className={styles.button} />
            </div>
          </header>

          {activeItem === "Home" ? (
            <HomeDashboard students={visibleStudents} />
          ) : activeItem === "Student Management" ? (
            <StudentManagement
              students={visibleStudents}
              onAddStudent={handleAddStudent}
              role={role}
              username={username}
              classCode={activeClass}
            />
          ) : (
            <AttendanceManagement students={visibleStudents} />
          )}
        </main>
      </div>
    </div>
  );
}
