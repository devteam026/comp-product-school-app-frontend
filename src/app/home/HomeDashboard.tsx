"use client";

import { useMemo, useState } from "react";
import styles from "../styles/home.module.css";
import type { Student } from "./data";

type HomeDashboardProps = {
  students: Student[];
  role: string;
  dashboardData?: {
    attendanceToday?: { present: number; absent: number; notRecorded?: number };
    feeStats?: { paid: number; unpaid: number; free: number };
    dailyAttendance?: { day: string; present: number; absent: number }[];
    classAttendance?: { classCode: string; present: number; absent: number }[];
    classStudentCounts?: { classCode: string; present: number; absent: number }[];
  } | null;
  isLoading?: boolean;
};

export default function HomeDashboard({
  students,
  role,
  dashboardData,
  isLoading,
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
  const feeStats = dashboardData?.feeStats ?? { paid: 0, unpaid: 0, free: 0 };
  const canSeeFees = role === "admin" || role === "accountant";
  const dailyAttendance = dashboardData?.dailyAttendance ?? [];
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
      "#2563eb",
      "#16a34a",
      "#f97316",
      "#ef4444",
      "#0ea5e9",
      "#a855f7",
      "#14b8a6",
      "#facc15",
    ];
    const color = colors[index % colors.length];
    const startDeg = (item.percentStart / 100) * 360;
    const endDeg = (item.percentEnd / 100) * 360;
    return { ...item, color, startDeg, endDeg };
  });
  const maxDailyValue = Math.max(...dailyAttendance.map((d) => d.present + d.absent), 1);

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
            <span>Not Recorded: {attendanceToday.notRecorded ?? 0}</span>
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

        {role === "admin" ? (
          <article className={styles.metricCard}>
            <h2 className={styles.metricTitle}>Lowest Attendance %</h2>
            {lowestAttendance ? (
              <>
                <p className={styles.metricValue}>
                  {lowestAttendance.rate.toFixed(0)}%
                </p>
                <div className={styles.metricSplit}>
                  <span>Class: {lowestAttendance.classCode}</span>
                  <span>
                    Present: {lowestAttendance.present}/{lowestAttendance.total}
                  </span>
                </div>
              </>
            ) : (
              <p className={styles.metricEmpty}>No attendance data</p>
            )}
          </article>
        ) : null}

        {canSeeFees ? (
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
        ) : null}
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

        <article className={styles.chartCard}>
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
        </article>

      </section>
    </div>
  );
}
