"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import styles from "../styles/home.module.css";
import LogoutButton from "./LogoutButton";
import StudentManagement from "./StudentManagement";
import AttendanceManagement from "./AttendanceManagement";
import FeeManagement from "./FeeManagement";
import AIEngine from "./AIEngine";
import HomeDashboard from "./HomeDashboard";
import { filterStudents, type Student } from "./data";
import StudentProfileModal from "./StudentProfileModal";
import { apiUrl } from "../../lib/api";

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
  const sidebarBg = process.env.NEXT_PUBLIC_SIDEBAR_BG?.trim();
  const brandTitle = process.env.NEXT_PUBLIC_BRAND_NAME?.trim() || "School Portal";
  const [activeItem, setActiveItem] = useState<MenuItem>("Home");
  const [students, setStudents] = useState<Student[]>([]);
  const [isStudentsLoading, setIsStudentsLoading] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Student | null>(null);
  const [dashboardData, setDashboardData] = useState<{
    attendanceToday?: { present: number; absent: number };
    feeStats?: { paid: number; unpaid: number; free: number };
    dailyAttendance?: { day: string; present: number; absent: number }[];
    classAttendance?: { classCode: string; present: number; absent: number }[];
    classStudentCounts?: { classCode: string; present: number; absent: number }[];
  } | null>(null);
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);

  const role = displayRole.toLowerCase();
  const navItems = useMemo(() => {
    if (role === "teacher") {
      return menuItems.filter((item) => item !== "Fee Management");
    }
    return menuItems;
  }, [role]);
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
    fetch(apiUrl(`/api/classes/teacher/${encodeURIComponent(username)}`), {
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
    fetch(apiUrl("/api/classes"), {
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

  useEffect(() => {
    if (navItems.includes(activeItem)) return;
    setActiveItem(navItems[0] ?? "Home");
  }, [navItems, activeItem]);

  const subtitleMap: Record<MenuItem, string> = {
    Home: "School overview for the day and month.",
    "Student Management": "Add and track students in one place.",
    "Attendance Management": "Track daily attendance for each class.",
    "Fee Management": "Manage monthly fees, payments, and reports.",
    "AI Insights": "AI insights and top-rated lists.",
  };

  const fetchStudents = async (code?: string) => {
    setIsStudentsLoading(true);
    const token = window.localStorage.getItem("authToken");
    const params = new URLSearchParams();
    if (code && code !== "all") params.set("classCode", code);
    const url = params.toString()
      ? apiUrl(`/api/students?${params.toString()}`)
      : apiUrl("/api/students");
    const response = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (response.ok) {
      const data = (await response.json()) as Student[];
      setStudents(Array.isArray(data) ? data : []);
    }
    setIsStudentsLoading(false);
  };

  const handleAddStudent = async (student: Student) => {
    const token = window.localStorage.getItem("authToken");
    const exists = students.some((item) => item.id === student.id);
    const url = exists
      ? apiUrl(`/api/students/${student.id}`)
      : apiUrl("/api/students");
      const payload = {
        ...(exists ? { id: student.id } : {}),
        name: student.name,
        grade: student.grade,
        section: student.section,
        gender: student.gender,
        dateOfBirth: student.dateOfBirth,
        admissionNumber: student.admissionNumber,
        rollNumber: student.rollNumber,
        address: student.address,
        parentName: student.parentName,
        parentRelation: student.parentRelation,
        parentPhone: student.parentPhone,
        parentEmail: student.parentEmail,
        parentOccupation: student.parentOccupation,
        status: student.status,
        feeType: student.feeType,
        profilePhotoKey: student.profilePhotoKey,
      };
    const response = await fetch(url, {
      method: exists ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });
    if (response.ok) {
      fetchStudents(activeClass);
    }
    return response.ok;
  };

  useEffect(() => {
    fetchStudents(activeClass);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeClass]);

  useEffect(() => {
    let isActive = true;
    setIsDashboardLoading(true);
    const token = window.localStorage.getItem("authToken");
    const classParam =
      activeClass && activeClass !== "all" ? `?classCode=${activeClass}` : "";
    fetch(apiUrl(`/api/dashboard${classParam}`), {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isActive || !data) return;
        setDashboardData({
          attendanceToday: data.attendanceToday,
          feeStats: data.feeStats,
          dailyAttendance: data.dailyAttendance,
          classAttendance: data.classAttendance,
          classStudentCounts: data.classStudentCounts,
        });
      })
      .catch(() => {
        // keep fallback UI data
      })
      .finally(() => {
        if (isActive) setIsDashboardLoading(false);
      });
    return () => {
      isActive = false;
    };
  }, [activeClass]);

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <aside
          className={styles.sidebar}
          style={
            sidebarBg
              ? ({ "--sidebar-bg": sidebarBg } as CSSProperties)
              : undefined
          }
        >
          <div>
            <div className={styles.brand}>{brandTitle}</div>
            <div className={styles.user}>
              {displayRole} · {username}
            </div>
            {role === "teacher" && activeClass ? (
              <div className={styles.user}>Class {activeClass}</div>
            ) : null}
          </div>

          <nav className={styles.nav}>
            {navItems.map((item) => (
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
            <HomeDashboard
              students={visibleStudents}
              role={role}
              dashboardData={dashboardData}
              isLoading={isDashboardLoading}
            />
          ) : activeItem === "Student Management" ? (
            <StudentManagement
              students={visibleStudents}
              onAddStudent={handleAddStudent}
              role={role}
              username={username}
              classCode={activeClass}
              isLoading={isStudentsLoading}
            />
          ) : activeItem === "Attendance Management" ? (
            <AttendanceManagement students={visibleStudents} isLoading={isStudentsLoading} />
          ) : activeItem === "Fee Management" ? (
            <FeeManagement students={visibleStudents} isLoading={isStudentsLoading} />
          ) : (
            <AIEngine
              classCode={activeClass === "all" ? undefined : activeClass}
              onStudentClick={(name) => {
                const match = visibleStudents.find((student) => student.name === name);
                if (match) {
                  setSelectedProfile(match);
                }
              }}
              isLoading={isStudentsLoading}
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
