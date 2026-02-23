"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "../styles/home.module.css";
import LogoutButton from "./LogoutButton";
import StudentManagement from "./StudentManagement";
import AttendanceManagement from "./AttendanceManagement";
import FeeManagement from "./FeeManagement";
import AIEngine from "./AIEngine";
import HomeDashboard from "./HomeDashboard";
import { filterStudents, seedStudents, type Student } from "./data";
import StudentProfileModal from "./StudentProfileModal";

const menuItems = [
  "Home",
  "Student Management",
  "Attendance Management",
  "Fee Management",
  "AI Insights",
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
  const [selectedProfile, setSelectedProfile] = useState<Student | null>(null);

  const role = displayRole.toLowerCase();
  const [adminClassOptions, setAdminClassOptions] = useState<string[]>([]);
  const [isAdminClassesLoading, setIsAdminClassesLoading] = useState(false);
  const [teacherOptions, setTeacherOptions] = useState<string[]>([]);
  const [isTeacherClassesLoading, setIsTeacherClassesLoading] = useState(false);
  const [activeClass, setActiveClass] = useState(role === "admin" ? "all" : "");

  useEffect(() => {
    if (role !== "teacher") return;
    let isActive = true;
    setIsTeacherClassesLoading(true);
    const token = window.localStorage.getItem("authToken");
    fetch(`http://localhost:8081/api/classes/teacher/${encodeURIComponent(username)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: string[]) => {
        if (!isActive) return;
        const classes = Array.isArray(data) ? data : [];
        setTeacherOptions(classes);
        if (classes.length > 0) {
          setActiveClass((prev) => (prev && classes.includes(prev) ? prev : classes[0]));
        } else {
          setActiveClass("");
        }
      })
      .finally(() => {
        if (isActive) setIsTeacherClassesLoading(false);
      });
    return () => {
      isActive = false;
    };
  }, [role, username]);

  useEffect(() => {
    if (role !== "admin") return;
    let isActive = true;
    setIsAdminClassesLoading(true);
    const token = window.localStorage.getItem("authToken");
    fetch("http://localhost:8081/api/classes", {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: string[]) => {
        if (!isActive) return;
        setAdminClassOptions(Array.isArray(data) ? data : []);
      })
      .finally(() => {
        if (isActive) setIsAdminClassesLoading(false);
      });
    return () => {
      isActive = false;
    };
  }, [role]);

  const visibleStudents = useMemo(
    () => filterStudents(students, role, username, activeClass),
    [students, role, username, activeClass]
  );

  const showNoClassNotice =
    role === "teacher" && !isTeacherClassesLoading && teacherOptions.length === 0;

  const subtitleMap: Record<MenuItem, string> = {
    Home: "School overview for the day and month.",
    "Student Management": "Add and track students in one place.",
    "Attendance Management": "Track daily attendance for each class.",
    "Fee Management": "Manage monthly fees, payments, and reports.",
    "AI Insights": "AI insights and top-rated lists.",
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
                    {isAdminClassesLoading ? (
                      <option value="" disabled>
                        Loading...
                      </option>
                    ) : (
                      adminClassOptions.map((code) => (
                        <option key={code} value={code}>
                          {code}
                        </option>
                      ))
                    )}
                  </select>
                </label>
              ) : role === "teacher" ? (
                <label className={styles.inlineLabel}>
                  Class
                  <select
                    className={styles.inlineSelect}
                    value={activeClass}
                    onChange={(event) => setActiveClass(event.target.value)}
                    disabled={isTeacherClassesLoading || teacherOptions.length === 0}
                  >
                    {isTeacherClassesLoading ? (
                      <option value="" disabled>
                        Loading...
                      </option>
                    ) : teacherOptions.length === 0 ? (
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

          {showNoClassNotice ? (
            <div className={styles.notice}>
              No classes are assigned to your account yet. Please contact the admin.
            </div>
          ) : null}

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
          ) : activeItem === "Attendance Management" ? (
            <AttendanceManagement students={visibleStudents} />
          ) : activeItem === "Fee Management" ? (
            <FeeManagement students={visibleStudents} />
          ) : (
            <AIEngine
              classCode={activeClass === "all" ? undefined : activeClass}
              onStudentClick={(name) => {
                const match = visibleStudents.find((student) => student.name === name);
                if (match) {
                  setSelectedProfile(match);
                }
              }}
            />
          )}
        </main>
      </div>

      {selectedProfile ? (
        <StudentProfileModal
          student={selectedProfile}
          onClose={() => setSelectedProfile(null)}
        />
      ) : null}
    </div>
  );
}
