"use client";

import { useState } from "react";
import styles from "./home.module.css";
import LogoutButton from "./LogoutButton";
import StudentManagement from "./StudentManagement";
import AttendanceManagement from "./AttendanceManagement";
import HomeDashboard from "./HomeDashboard";

const menuItems = [
  "Home",
  "Student Management",
  "Attendance Management",
] as const;

type MenuItem = (typeof menuItems)[number];

type HomeShellProps = {
  displayRole: string;
  username: string;
};

export default function HomeShell({ displayRole, username }: HomeShellProps) {
  const [activeItem, setActiveItem] = useState<MenuItem>("Home");

  const subtitleMap: Record<MenuItem, string> = {
    Home: "School overview for the day and month.",
    "Student Management": "Add and track students in one place.",
    "Attendance Management": "Track daily attendance for each class.",
  };

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <div>
            <div className={styles.brand}>School Portal</div>
            <div className={styles.user}>
              {displayRole} · {username}
            </div>
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
            <LogoutButton className={styles.button} />
          </header>

          {activeItem === "Home" ? (
            <HomeDashboard />
          ) : activeItem === "Student Management" ? (
            <StudentManagement />
          ) : (
            <AttendanceManagement />
          )}
        </main>
      </div>
    </div>
  );
}
