"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "../styles/home.module.css";
import type { Student } from "./data";
import { apiUrl } from "../../lib/api";

const WIDGETS = [
  { key: "totalStudents",       label: "Total Students" },
  { key: "todayAttendance",     label: "Today's Attendance" },
  { key: "lowestAttendance",    label: "Lowest Attendance %",  roles: ["admin"] },
  { key: "feesThisMonth",       label: "Fees This Month",      roles: ["admin", "accountant"] },
  { key: "transport",           label: "Transport" },
  { key: "hostel",              label: "Hostel" },
  { key: "newAdmissions",       label: "New Admissions" },
  { key: "leaveRequests",       label: "Leave Requests",       roles: ["admin"] },
  { key: "collectionRate",      label: "Collection Rate",      roles: ["admin", "accountant"] },
  { key: "dailyAttendance",     label: "Daily Attendance Chart" },
  { key: "studentsByClass",     label: "Students by Class" },
  { key: "classAttendanceToday",label: "Class Attendance Today" },
  { key: "todayAbsentees",      label: "Today's Absentees" },
] as const;

type WidgetKey = (typeof WIDGETS)[number]["key"];

const LS_KEY = "dashboard_widgets_hidden";

type HomeDashboardProps = {
  students: Student[];
  role: string;
  username?: string;
  dashboardData?: {
    attendanceToday?: { present: number; absent: number; notRecorded?: number };
    feeStats?: { paid: number; unpaid: number; partial: number; collectedAmount?: number };
    dailyAttendance?: { day: string; present: number; absent: number }[];
    classAttendance?: { classCode: string; present: number; absent: number }[];
    classStudentCounts?: { classCode: string; present: number; absent: number }[];
    newAdmissionsThisMonth?: number;
    pendingLeaveCount?: number;
  } | null;
  isLoading?: boolean;
  onStudentClick?: (student: Student) => void;
  onNavigate?: (section: string) => void;
};

export default function HomeDashboard({
  students,
  role,
  username,
  dashboardData,
  isLoading,
  onStudentClick,
  onNavigate,
}: HomeDashboardProps) {
  const activeStudents = useMemo(
    () => students.filter((student) => student.status === "Active"),
    [students]
  );
  const totalStudents = activeStudents.length;
  const maleCount = activeStudents.filter(
    (student) => student.gender === "Male"
  ).length;
  const femaleCount = activeStudents.filter(
    (student) => student.gender === "Female"
  ).length;
  const attendanceToday = dashboardData?.attendanceToday ?? {
    present: 0,
    absent: 0,
    notRecorded: 0,
  };
  const feeStats = dashboardData?.feeStats ?? { paid: 0, unpaid: 0, partial: 0 };
  const canSeeFees = role === "admin" || role === "accountant";
  const dailyAttendance = (dashboardData?.dailyAttendance ?? []).slice(-7);
  const classAttendance = dashboardData?.classAttendance ?? [];
  const classStudentCounts = dashboardData?.classStudentCounts ?? [];
  const lowestAttendance = useMemo(() => {
    if (!classAttendance.length) return null;
    return classAttendance
      .map((item) => {
        const present = Number(item.present ?? 0);
        const absent = Number(item.absent ?? 0);
        const total = present + absent;
        const rate = total === 0 ? 0 : (present / total) * 100;
        return { ...item, present, absent, total, rate };
      })
      .sort((a, b) => a.rate - b.rate)[0];
  }, [classAttendance]);
  const totalStudentsByClass = classStudentCounts.reduce(
    (sum, item) => sum + Number(item.present ?? 0),
    0
  );
  let runningPercent = 0;
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    label: string;
  } | null>(null);
  const classPie = classStudentCounts.map((item, index, arr) => {
    const count = Number(item.present ?? 0);
    const percent =
      totalStudentsByClass === 0 ? 0 : (count / totalStudentsByClass) * 100;
    const start = arr.length === 1 && totalStudentsByClass > 0 ? 0 : runningPercent;
    const end =
      arr.length === 1 && totalStudentsByClass > 0 ? 100 : runningPercent + percent;
    runningPercent = end;
    return {
      ...item,
      present: count,
      percentStart: Number(start.toFixed(2)),
      percentEnd: Number(end.toFixed(2)),
    };
  });
  const pieSlices = classPie.map((item, index) => {
    const colors = [
      "#16a34a",
      "#2563eb",
      "#0891b2",
      "#7c3aed",
      "#ea580c",
      "#0d9488",
      "#db2777",
      "#ca8a04",
    ];
    const color = colors[index % colors.length];
    const startDeg = (item.percentStart / 100) * 360;
    const endDeg = (item.percentEnd / 100) * 360;
    return { ...item, color, startDeg, endDeg };
  });
  const maxDailyValue = Math.max(...dailyAttendance.map((d) => d.present + d.absent), 1);

  // Transport utilization — derived from students prop
  const transportCount = useMemo(
    () => activeStudents.filter((s) => s.transportRequired === true).length,
    [activeStudents]
  );

  // Hostel occupancy — derived from students prop
  const hostelCount = useMemo(
    () => activeStudents.filter((s) => s.hostelRequired === true).length,
    [activeStudents]
  );

  const newAdmissionsThisMonth = dashboardData?.newAdmissionsThisMonth ?? 0;
  const pendingLeaveCount = dashboardData?.pendingLeaveCount ?? 0;
  const feeCollectedAmount = dashboardData?.feeStats?.collectedAmount ?? 0;
  const feeCollectionRate = useMemo(() => {
    const { paid, unpaid, partial } = feeStats;
    const total = paid + unpaid + partial;
    return total === 0 ? 0 : Math.round((paid / total) * 100);
  }, [feeStats]);

  // Greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);
  const todayLabel = useMemo(() =>
    new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
  []);

  // Widget visibility preferences
  const [hiddenWidgets, setHiddenWidgets] = useState<Set<WidgetKey>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      return new Set(JSON.parse(localStorage.getItem(LS_KEY) ?? "[]") as WidgetKey[]);
    } catch { return new Set(); }
  });
  const [showCustomize, setShowCustomize] = useState(false);
  const customizePanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify([...hiddenWidgets]));
  }, [hiddenWidgets]);

  // Close customize panel on outside click
  useEffect(() => {
    if (!showCustomize) return;
    const handler = (e: MouseEvent) => {
      if (customizePanelRef.current && !customizePanelRef.current.contains(e.target as Node)) {
        setShowCustomize(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showCustomize]);

  const toggleWidget = (key: WidgetKey) => {
    setHiddenWidgets((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };
  const hidden = (key: WidgetKey) => hiddenWidgets.has(key);

  // Visible widgets for the customize panel (role-filtered)
  const visibleWidgetOptions = WIDGETS.filter(
    (w) => !("roles" in w) || (w as { roles: readonly string[] }).roles.includes(role)
  );

  // Today's absentees — fetched from attendance API
  const [absentStudents, setAbsentStudents] = useState<Student[]>([]);
  const [isAbsenteesLoading, setIsAbsenteesLoading] = useState(false);
  useEffect(() => {
    let isActive = true;
    setIsAbsenteesLoading(true);
    const today = new Date().toISOString().slice(0, 10);
    const token = window.localStorage.getItem("authToken");
    fetch(apiUrl(`/api/attendance?date=${today}`), {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isActive || !data?.records) return;
        const absentIds = new Set<string>(
          (data.records as { studentId: string; status: string }[])
            .filter((r) => r.status === "Absent")
            .map((r) => r.studentId)
        );
        setAbsentStudents(students.filter((s) => absentIds.has(s.id)));
      })
      .catch(() => {})
      .finally(() => { if (isActive) setIsAbsenteesLoading(false); });
    return () => { isActive = false; };
  // re-run when visible students change (e.g. class filter)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students]);

  if (isLoading) {
    return (
      <div className={styles.dashboard}>
        <section className={styles.metricGrid}>
          <article className={styles.metricCard}>
            <div className={styles.skeletonTitle} />
            <div className={styles.skeletonValue} />
            <div className={styles.skeletonLine} />
          </article>
          <article className={styles.metricCard}>
            <div className={styles.skeletonTitle} />
            <div className={styles.skeletonValue} />
            <div className={styles.skeletonLine} />
          </article>
          <article className={styles.metricCard}>
            <div className={styles.skeletonTitle} />
            <div className={styles.skeletonValue} />
            <div className={styles.skeletonLine} />
          </article>
        </section>
        <section className={styles.chartGrid}>
          <article className={styles.chartCard}>
            <div className={styles.skeletonTitle} />
            <div className={styles.skeletonChart} />
          </article>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.greetingBanner}>
        <div className={styles.greetingText}>
          <span className={styles.greetingHello}>
            {greeting}{username ? `, ${username}` : ""}!
          </span>
          <span className={styles.greetingDate}>{todayLabel}</span>
        </div>
        <div className={styles.greetingActions}>
          {(role === "admin" || role === "teacher") && onNavigate && (
            <button
              type="button"
              className={styles.markAttendanceBtn}
              onClick={() => onNavigate("Attendance Management")}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 11l3 3L22 4"/>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
              Mark Attendance
            </button>
          )}
          <div ref={customizePanelRef} className={styles.customizeWrap}>
            <button
              type="button"
              className={styles.customizeBtn}
              onClick={() => setShowCustomize((v) => !v)}
              aria-expanded={showCustomize}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
              Customize
            </button>
            {showCustomize && (
              <div className={styles.customizePanel}>
                <div className={styles.customizePanelHeader}>
                  <span>Show / Hide Widgets</span>
                  <button type="button" className={styles.customizeClose} onClick={() => setShowCustomize(false)}>✕</button>
                </div>
                <ul className={styles.customizeList}>
                  {visibleWidgetOptions.map((w) => {
                    const isVisible = !hiddenWidgets.has(w.key);
                    return (
                      <li key={w.key} className={styles.customizeItem}>
                        <span className={styles.customizeLabel}>{w.label}</span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={isVisible}
                          className={`${styles.toggleSwitch} ${isVisible ? styles.toggleOn : ""}`}
                          onClick={() => toggleWidget(w.key)}
                        >
                          <span className={styles.toggleThumb} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      <section className={styles.metricGrid}>
        {/* Total Students */}
        {!hidden("totalStudents") && <article className={`${styles.metricCard} ${styles.cardClickable}`} onClick={() => onNavigate?.("Student Management")}>
          <div className={styles.metricCardHeader}>
            <h2 className={styles.metricTitle}>Total Students</h2>
            <div className={styles.metricIconBadge} aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
          </div>
          <p className={styles.metricValue}>{totalStudents}</p>
          <div className={styles.metricSplit}>
            <span className={`${styles.metricSplitBadge} ${styles.metricSplitPresent}`}>♂ {maleCount} Male</span>
            <span className={`${styles.metricSplitBadge} ${styles.metricSplitMuted}`}>♀ {femaleCount} Female</span>
          </div>
          <div className={styles.metricBar}>
            <span
              className={styles.metricFill}
              style={{ width: `${totalStudents === 0 ? 0 : (maleCount / totalStudents) * 100}%` }}
            />
            <span
              className={styles.metricFillAlt}
              style={{ width: `${totalStudents === 0 ? 0 : (femaleCount / totalStudents) * 100}%` }}
            />
          </div>
        </article>}

        {/* Today's Attendance */}
        {!hidden("todayAttendance") && <article className={`${styles.metricCard} ${styles.cardClickable}`} onClick={() => onNavigate?.("Attendance Management")}>
          <div className={styles.metricCardHeader}>
            <h2 className={styles.metricTitle}>Today&apos;s Attendance</h2>
            <div className={styles.metricIconBadge} aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            </div>
          </div>
          <p className={styles.metricValue}>{attendanceToday.present}</p>
          <div className={styles.metricSplit}>
            <span className={`${styles.metricSplitBadge} ${styles.metricSplitPresent}`}>✓ {attendanceToday.present} Present</span>
            <span className={`${styles.metricSplitBadge} ${styles.metricSplitAbsent}`}>✗ {attendanceToday.absent} Absent</span>
            {(attendanceToday.notRecorded ?? 0) > 0 && (
              <span className={`${styles.metricSplitBadge} ${styles.metricSplitMuted}`}>— {attendanceToday.notRecorded} Unrecorded</span>
            )}
          </div>
          <div className={styles.metricBar}>
            <span
              className={styles.metricFill}
              style={{ width: `${(attendanceToday.present / Math.max(attendanceToday.present + attendanceToday.absent, 1)) * 100}%` }}
            />
            <span
              className={styles.metricFillAlt}
              style={{ width: `${(attendanceToday.absent / Math.max(attendanceToday.present + attendanceToday.absent, 1)) * 100}%` }}
            />
          </div>
        </article>}

        {/* Lowest Attendance (admin only) */}
        {role === "admin" && !hidden("lowestAttendance") ? (
          <article className={`${styles.metricCard} ${styles.cardClickable}`} onClick={() => onNavigate?.("Attendance Management")}>
            <div className={styles.metricCardHeader}>
              <h2 className={styles.metricTitle}>Lowest Attendance %</h2>
              <div className={styles.metricIconBadge} aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
              </div>
            </div>
            {lowestAttendance ? (
              <>
                <p className={styles.metricValue}>{lowestAttendance.rate.toFixed(0)}%</p>
                <div className={styles.metricSplit}>
                  <span className={`${styles.metricSplitBadge} ${styles.metricSplitMuted}`}>Class {lowestAttendance.classCode}</span>
                  <span className={`${styles.metricSplitBadge} ${styles.metricSplitPresent}`}>{lowestAttendance.present}/{lowestAttendance.total} Present</span>
                </div>
                <div className={styles.metricBar}>
                  <span className={styles.metricFill} style={{ width: `${lowestAttendance.rate}%` }} />
                  <span className={styles.metricFillAlt} style={{ width: `${100 - lowestAttendance.rate}%` }} />
                </div>
              </>
            ) : (
              <p className={styles.metricEmpty}>No attendance data yet</p>
            )}
          </article>
        ) : null}

        {/* Fee Stats (admin / accountant) */}
        {canSeeFees && !hidden("feesThisMonth") ? (
          <article className={`${styles.metricCard} ${styles.cardClickable}`} onClick={() => onNavigate?.("Fee Management")}>
            <div className={styles.metricCardHeader}>
              <h2 className={styles.metricTitle}>Fees This Month</h2>
              <div className={styles.metricIconBadge} aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23"/>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
            </div>
            <p className={styles.metricValue}>{feeStats.paid}</p>
            <div className={styles.metricSplit}>
              <span className={`${styles.metricSplitBadge} ${styles.metricSplitPresent}`}>✓ {feeStats.paid} Paid</span>
              <span className={`${styles.metricSplitBadge} ${styles.metricSplitAbsent}`}>✗ {feeStats.unpaid} Unpaid</span>
              <span className={`${styles.metricSplitBadge} ${styles.metricSplitMuted}`}>◑ {feeStats.partial} Partial</span>
            </div>
            <div className={styles.metricBar}>
              <span className={styles.metricFill} style={{ width: `${(feeStats.paid / Math.max(feeStats.paid + feeStats.unpaid + feeStats.partial, 1)) * 100}%` }} />
              <span className={styles.metricFillAlt} style={{ width: `${(feeStats.unpaid / Math.max(feeStats.paid + feeStats.unpaid + feeStats.partial, 1)) * 100}%` }} />
              <span className={styles.metricFillMuted} style={{ width: `${(feeStats.partial / Math.max(feeStats.paid + feeStats.unpaid + feeStats.partial, 1)) * 100}%` }} />
            </div>
          </article>
        ) : null}

        {/* Transport Utilization */}
        {!hidden("transport") && <article className={`${styles.metricCard} ${styles.cardClickable}`} onClick={() => onNavigate?.("Transport Management")}>
          <div className={styles.metricCardHeader}>
            <h2 className={styles.metricTitle}>Transport</h2>
            <div className={styles.metricIconBadge} aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13" rx="2"/>
                <path d="M16 8h4l3 3v5h-7V8z"/>
                <circle cx="5.5" cy="18.5" r="2.5"/>
                <circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
            </div>
          </div>
          <p className={styles.metricValue}>{transportCount}</p>
          <div className={styles.metricSplit}>
            <span className={`${styles.metricSplitBadge} ${styles.metricSplitPresent}`}>🚌 {transportCount} Using transport</span>
            <span className={`${styles.metricSplitBadge} ${styles.metricSplitMuted}`}>{totalStudents - transportCount} Not enrolled</span>
          </div>
          <div className={styles.metricBar}>
            <span
              className={styles.metricFill}
              style={{ width: `${totalStudents === 0 ? 0 : (transportCount / totalStudents) * 100}%` }}
            />
            <span
              className={styles.metricFillMuted}
              style={{ width: `${totalStudents === 0 ? 0 : ((totalStudents - transportCount) / totalStudents) * 100}%` }}
            />
          </div>
        </article>}

        {/* Hostel Occupancy */}
        {!hidden("hostel") && <article className={`${styles.metricCard} ${styles.cardClickable}`} onClick={() => onNavigate?.("Hostel Management")}>
          <div className={styles.metricCardHeader}>
            <h2 className={styles.metricTitle}>Hostel</h2>
            <div className={styles.metricIconBadge} aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
          </div>
          <p className={styles.metricValue}>{hostelCount}</p>
          <div className={styles.metricSplit}>
            <span className={`${styles.metricSplitBadge} ${styles.metricSplitPresent}`}>🏠 {hostelCount} In hostel</span>
            <span className={`${styles.metricSplitBadge} ${styles.metricSplitMuted}`}>{totalStudents - hostelCount} Day scholars</span>
          </div>
          <div className={styles.metricBar}>
            <span
              className={styles.metricFill}
              style={{ width: `${totalStudents === 0 ? 0 : (hostelCount / totalStudents) * 100}%` }}
            />
            <span
              className={styles.metricFillMuted}
              style={{ width: `${totalStudents === 0 ? 0 : ((totalStudents - hostelCount) / totalStudents) * 100}%` }}
            />
          </div>
        </article>}

        {/* New Admissions This Month */}
        {!hidden("newAdmissions") && <article className={`${styles.metricCard} ${styles.cardClickable}`} onClick={() => onNavigate?.("Student Management")}>
          <div className={styles.metricCardHeader}>
            <h2 className={styles.metricTitle}>New Admissions</h2>
            <div className={styles.metricIconBadge} aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="8.5" cy="7" r="4"/>
                <line x1="20" y1="8" x2="20" y2="14"/>
                <line x1="23" y1="11" x2="17" y2="11"/>
              </svg>
            </div>
          </div>
          <p className={styles.metricValue}>{newAdmissionsThisMonth}</p>
          <div className={styles.metricSplit}>
            <span className={`${styles.metricSplitBadge} ${styles.metricSplitMuted}`}>This month</span>
          </div>
        </article>}

        {/* Pending Leave Requests (admin only) */}
        {role === "admin" && !hidden("leaveRequests") ? (
          <article className={`${styles.metricCard} ${styles.cardClickable}`} onClick={() => onNavigate?.("Leave Management")}>
            <div className={styles.metricCardHeader}>
              <h2 className={styles.metricTitle}>Leave Requests</h2>
              <div className={styles.metricIconBadge} aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
            </div>
            <p className={styles.metricValue}>{pendingLeaveCount}</p>
            <div className={styles.metricSplit}>
              {pendingLeaveCount === 0 ? (
                <span className={`${styles.metricSplitBadge} ${styles.metricSplitPresent}`}>All clear</span>
              ) : (
                <span className={`${styles.metricSplitBadge} ${styles.metricSplitAbsent}`}>⏳ Pending approval</span>
              )}
            </div>
          </article>
        ) : null}

        {/* Fee Collection Rate (admin/accountant) */}
        {canSeeFees && !hidden("collectionRate") ? (
          <article className={`${styles.metricCard} ${styles.cardClickable}`} onClick={() => onNavigate?.("Fee Management")}>
            <div className={styles.metricCardHeader}>
              <h2 className={styles.metricTitle}>Collection Rate</h2>
              <div className={styles.metricIconBadge} aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
                  <polyline points="16 7 22 7 22 13"/>
                </svg>
              </div>
            </div>
            <p className={styles.metricValue}>{feeCollectionRate}%</p>
            <div className={styles.metricSplit}>
              <span className={`${styles.metricSplitBadge} ${styles.metricSplitPresent}`}>
                {feeStats.paid} of {feeStats.paid + feeStats.unpaid + feeStats.partial} paid
              </span>
              {feeCollectedAmount > 0 && (
                <span className={`${styles.metricSplitBadge} ${styles.metricSplitMuted}`}>
                  ₹{Number(feeCollectedAmount).toLocaleString("en-IN")}
                </span>
              )}
            </div>
            <div className={styles.metricBar}>
              <span className={styles.metricFill} style={{ width: `${feeCollectionRate}%` }} />
              <span className={styles.metricFillAlt} style={{ width: `${100 - feeCollectionRate}%` }} />
            </div>
          </article>
        ) : null}
      </section>

      <section className={styles.chartGrid}>
        {!hidden("dailyAttendance") && <article className={`${styles.chartCard} ${styles.cardClickable}`} onClick={() => onNavigate?.("Attendance Management")}>
          <div className={styles.chartHeader}>
            <div>
              <h3 className={styles.chartTitle}>Daily Attendance</h3>
              <p className={styles.chartSubtitle}>Present vs Absent (last 7 days)</p>
            </div>
          </div>
          <div className={styles.legend}>
            <span className={styles.legendItem}>
              <span className={styles.legendSwatch} style={{ background: "#16a34a" }} />
              Present
            </span>
            <span className={styles.legendItem}>
              <span className={styles.legendSwatch} style={{ background: "#dc2626" }} />
              Absent
            </span>
          </div>
          <div className={styles.chartBars}>
            {dailyAttendance.map((day, index) => {
              const total = day.present + day.absent;
              return (
                <div key={index} className={styles.chartBarGroup}>
                  <div className={styles.chartStack}>
                    <span
                      className={styles.chartBarPrimary}
                      style={{ height: `${(day.present / maxDailyValue) * 100}%` }}
                    />
                    <span
                      className={styles.chartBarSecondary}
                      style={{ height: `${(day.absent / maxDailyValue) * 100}%` }}
                    />
                  </div>
                  <span className={styles.chartLabel}>{day.day}</span>
                  <span className={styles.chartValue}>{total}</span>
                </div>
              );
            })}
          </div>
        </article>}

        {!hidden("studentsByClass") && <article className={`${styles.chartCard} ${styles.cardClickable}`} onClick={() => onNavigate?.("Student Management")}>
          <div className={styles.chartHeader}>
            <div>
              <h3 className={styles.chartTitle}>Students by Class</h3>
              <p className={styles.chartSubtitle}>Distribution of students per class</p>
            </div>
          </div>
          {classPie.length === 0 ? (
            <div className={styles.empty}>No class data yet.</div>
          ) : (
            <div className={styles.donutLayout}>
              <div className={styles.pieWrap}>
                <svg
                  className={styles.pieChart}
                  viewBox="0 0 100 100"
                  role="img"
                  onMouseLeave={() => setTooltip(null)}
                >
                {pieSlices.length === 0 ? (
                  <circle cx="50" cy="50" r="48" fill="#e2e8f0" />
                ) : classPie.length === 1 && totalStudentsByClass > 0 ? (
                  <circle
                    cx="50"
                    cy="50"
                    r="50"
                    fill={pieSlices[0]?.color ?? "#2563eb"}
                    className={styles.pieSlice}
                    onMouseMove={(event) => {
                      const rect = (
                        event.currentTarget.ownerSVGElement as SVGSVGElement
                      ).getBoundingClientRect();
                      setTooltip({
                        x: event.clientX - rect.left,
                        y: event.clientY - rect.top,
                        label: `Class ${classPie[0].classCode}: ${classPie[0].present} students`,
                      });
                    }}
                  />
                ) : (
                  pieSlices.map((slice) => {
                    if (slice.endDeg - slice.startDeg <= 0.01) {
                      return null;
                    }
                    const largeArc = slice.endDeg - slice.startDeg > 180 ? 1 : 0;
                    const startRad = (Math.PI / 180) * (slice.startDeg - 90);
                    const endRad = (Math.PI / 180) * (slice.endDeg - 90);
                    const x1 = 50 + 50 * Math.cos(startRad);
                    const y1 = 50 + 50 * Math.sin(startRad);
                    const x2 = 50 + 50 * Math.cos(endRad);
                    const y2 = 50 + 50 * Math.sin(endRad);
                    const d = `M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArc} 1 ${x2} ${y2} Z`;
                    return (
                      <path
                        key={slice.classCode}
                        d={d}
                        fill={slice.color}
                        className={styles.pieSlice}
                        onMouseMove={(event) => {
                          const rect = (event.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                          setTooltip({
                            x: event.clientX - rect.left,
                            y: event.clientY - rect.top,
                            label: `Class ${slice.classCode}: ${slice.present} students`,
                          });
                        }}
                      />
                    );
                  })
                )}
                </svg>
                {tooltip ? (
                  <div
                    className={styles.pieTooltip}
                    style={{ left: tooltip.x, top: tooltip.y }}
                  >
                    {tooltip.label}
                  </div>
                ) : null}
              </div>
              <div className={styles.donutLegend}>
                {pieSlices.map((item) => {
                  return (
                    <div key={item.classCode} className={styles.donutLegendItem}>
                      <span
                        className={styles.donutSwatch}
                        style={{ background: item.color }}
                      />
                      <span>
                        Class {item.classCode}: {item.present}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </article>}

        {/* Class-wise Attendance Today */}
        {!hidden("classAttendanceToday") && <article className={`${styles.chartCard} ${styles.cardClickable}`} onClick={() => onNavigate?.("Attendance Management")}>
          <div className={styles.chartHeader}>
            <div>
              <h3 className={styles.chartTitle}>Class Attendance Today</h3>
              <p className={styles.chartSubtitle}>Present rate per class</p>
            </div>
          </div>
          {classAttendance.length === 0 ? (
            <div className={styles.empty}>No attendance data yet.</div>
          ) : (
            <div className={styles.classAttendanceList}>
              {classAttendance.map((item) => {
                const total = Number(item.present ?? 0) + Number(item.absent ?? 0);
                const rate = total === 0 ? null : Math.round((Number(item.present) / total) * 100);
                const isLow = rate !== null && rate < 75;
                return (
                  <div key={item.classCode} className={styles.classAttendanceRow}>
                    <span className={styles.classAttendanceCode}>Class {item.classCode}</span>
                    <div className={styles.classAttendanceBar}>
                      <span
                        className={styles.classAttendanceFill}
                        style={{ width: `${rate ?? 0}%`, background: isLow ? "#dc2626" : "#16a34a" }}
                      />
                    </div>
                    <span className={`${styles.classAttendanceRate} ${isLow ? styles.classAttendanceLow : ""}`}>
                      {rate === null ? "—" : `${rate}%`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </article>}

      </section>

      {/* Today's Absentee List */}
      {!hidden("todayAbsentees") && <section className={styles.chartGrid}>
        <article className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div>
              <h3 className={styles.chartTitle}>Today&apos;s Absentees</h3>
              <p className={styles.chartSubtitle}>Students marked absent today</p>
            </div>
            {absentStudents.length > 0 && (
              <span className={`${styles.metricSplitBadge} ${styles.metricSplitAbsent}`}>
                {absentStudents.length} absent
              </span>
            )}
          </div>
          {isAbsenteesLoading ? (
            <div className={styles.absenteeList}>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className={styles.skeletonLine} />
              ))}
            </div>
          ) : absentStudents.length === 0 ? (
            <div className={styles.empty}>No absences recorded today.</div>
          ) : (
            <ul className={styles.absenteeList}>
              {absentStudents.slice(0, 5).map((student) => (
                <li key={student.id} className={styles.absenteeItem}>
                  <span className={styles.absenteeInfo}>
                    <span className={styles.absenteeName}>{student.name}</span>
                    <span className={styles.absenteeMeta}>
                      Class {student.classCode} · Roll {student.rollNumber || "—"}
                    </span>
                  </span>
                  {onStudentClick ? (
                    <button
                      type="button"
                      className={styles.absenteeViewBtn}
                      onClick={() => onStudentClick(student)}
                    >
                      View
                    </button>
                  ) : null}
                </li>
              ))}
              {absentStudents.length > 5 && (
                <li className={styles.absenteeMore}>
                  +{absentStudents.length - 5} more absent
                </li>
              )}
            </ul>
          )}
        </article>
      </section>}
    </div>
  );
}
