"use client";

import styles from "../styles/home.module.css";
import type { Student } from "./data";

type HomeDashboardProps = {
  students: Student[];
  dashboardData?: {
    attendanceToday?: { present: number; absent: number };
    feeStats?: { paid: number; unpaid: number; free: number };
    dailyAttendance?: { day: string; present: number; absent: number }[];
  } | null;
};

export default function HomeDashboard({ students, dashboardData }: HomeDashboardProps) {
  const totalStudents = students.length;
  const maleCount = students.filter((student) => student.gender === "Male").length;
  const femaleCount = students.filter(
    (student) => student.gender === "Female"
  ).length;
  const attendanceToday = dashboardData?.attendanceToday ?? { present: 0, absent: 0 };
  const feeStats = dashboardData?.feeStats ?? { paid: 0, unpaid: 0, free: 0 };
  const dailyAttendance = dashboardData?.dailyAttendance ?? [];
  const maxDailyValue = Math.max(...dailyAttendance.map((d) => d.present + d.absent), 1);

  return (
    <div className={styles.dashboard}>
      <section className={styles.metricGrid}>
        <article className={styles.metricCard}>
          <h2 className={styles.metricTitle}>Total Students</h2>
          <p className={styles.metricValue}>{totalStudents}</p>
          <div className={styles.metricSplit}>
            <span>Male: {maleCount}</span>
            <span>Female: {femaleCount}</span>
          </div>
          <div className={styles.metricBar}>
            <span
              className={styles.metricFill}
              style={{
                width: `${
                  totalStudents === 0 ? 0 : (maleCount / totalStudents) * 100
                }%`,
              }}
            />
            <span
              className={styles.metricFillAlt}
              style={{
                width: `${
                  totalStudents === 0 ? 0 : (femaleCount / totalStudents) * 100
                }%`,
              }}
            />
          </div>
        </article>

        <article className={styles.metricCard}>
          <h2 className={styles.metricTitle}>Today Attendance</h2>
          <p className={styles.metricValue}>{attendanceToday.present}</p>
          <div className={styles.metricSplit}>
            <span>Present: {attendanceToday.present}</span>
            <span>Absent: {attendanceToday.absent}</span>
          </div>
          <div className={styles.metricBar}>
            <span
              className={styles.metricFill}
              style={{
                width: `${
                  (attendanceToday.present /
                    Math.max(attendanceToday.present + attendanceToday.absent, 1)) *
                  100
                }%`,
              }}
            />
            <span
              className={styles.metricFillAlt}
              style={{
                width: `${
                  (attendanceToday.absent /
                    Math.max(attendanceToday.present + attendanceToday.absent, 1)) *
                  100
                }%`,
              }}
            />
          </div>
        </article>

        <article className={styles.metricCard}>
          <h2 className={styles.metricTitle}>Fees This Month</h2>
          <p className={styles.metricValue}>{feeStats.paid}</p>
          <div className={styles.metricSplit}>
            <span>Paid: {feeStats.paid}</span>
            <span>Unpaid: {feeStats.unpaid}</span>
            <span>Free: {feeStats.free}</span>
          </div>
          <div className={styles.metricBar}>
            <span
              className={styles.metricFill}
              style={{
                width: `${
                  (feeStats.paid /
                    (feeStats.paid + feeStats.unpaid + feeStats.free)) *
                  100
                }%`,
              }}
            />
            <span
              className={styles.metricFillAlt}
              style={{
                width: `${
                  (feeStats.unpaid /
                    (feeStats.paid + feeStats.unpaid + feeStats.free)) *
                  100
                }%`,
              }}
            />
            <span
              className={styles.metricFillMuted}
              style={{
                width: `${
                  (feeStats.free /
                    (feeStats.paid + feeStats.unpaid + feeStats.free)) *
                  100
                }%`,
              }}
            />
          </div>
        </article>
      </section>

      <section className={styles.chartGrid}>
        <article className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div>
              <h3 className={styles.chartTitle}>Daily Attendance</h3>
              <p className={styles.chartSubtitle}>Present vs Absent (last 5 days)</p>
            </div>
          </div>
          <div className={styles.legend}>
            <span className={styles.legendItem}>
              <span className={styles.legendSwatch} style={{ background: "#6366f1" }} />
              Present
            </span>
            <span className={styles.legendItem}>
              <span className={styles.legendSwatch} style={{ background: "#0ea5e9" }} />
              Absent
            </span>
          </div>
          <div className={styles.chartBars}>
            {dailyAttendance.map((day) => {
              const total = day.present + day.absent;
              return (
                <div key={day.day} className={styles.chartBarGroup}>
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
        </article>

      </section>
    </div>
  );
}
