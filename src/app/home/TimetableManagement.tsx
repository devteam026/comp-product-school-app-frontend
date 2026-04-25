"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "../styles/home.module.css";
import { apiUrl } from "../../lib/api";

type Period = {
  id: number;
  dayOfWeek: string;
  periodNo: number;
  startTime: string;
  endTime: string;
  startDate?: string;
  endDate?: string;
  classId?: number;
  classCode?: string;
};

type Assignment = {
  id: number;
  teacherId: number;
  classId: number;
  subjectId: number;
  periodId: number;
  weekKey: string;
  locked: boolean;
};

type Teacher = { id: number; name: string; subjectIds: number[] };
type Subject = { id: number; name: string; color?: string };
type ClassItem = { id: number; name: string; section: string; classCode: string };
type ClassManage = { id: number; name: string; section: string; classCode: string };

const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;

type TimetableManagementProps = {
  activeClassCode?: string;
  onSelectClass?: (classCode: string) => void;
  role?: string;
};

export default function TimetableManagement({
  activeClassCode,
  onSelectClass,
  role,
}: TimetableManagementProps) {
  const isAdmin = role === "admin" || !role;
  const [activeTab, setActiveTab] = useState<
    "Timetable" | "Manage Period"
  >("Timetable");
  const [weekKey, setWeekKey] = useState("default");
  const [periods, setPeriods] = useState<Period[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [filterClassId, setFilterClassId] = useState("");
  const [filterTeacherId, setFilterTeacherId] = useState("");
  const [filterSubjectId, setFilterSubjectId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pending, setPending] = useState<Record<string, { teacherId?: number; subjectId?: number }>>({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [classSetupPeriods, setClassSetupPeriods] = useState<Period[]>([]);
  const [classSetupClasses, setClassSetupClasses] = useState<ClassManage[]>([]);
  const [setupClassId, setSetupClassId] = useState(""); // form dropdown only
  const [tablePeriodClassId, setTablePeriodClassId] = useState(""); // drives the table
  const [periodDay, setPeriodDay] = useState("MON");
  const [periodNo, setPeriodNo] = useState(1);
  const [periodStart, setPeriodStart] = useState("09:00");
  const [periodEnd, setPeriodEnd] = useState("09:45");
  const [periodStartDate, setPeriodStartDate] = useState("");
  const [periodEndDate, setPeriodEndDate] = useState("");
  const [editingPeriodId, setEditingPeriodId] = useState<number | null>(null);
  const [isPeriodSaving, setIsPeriodSaving] = useState(false);
  const [isPeriodsLoading, setIsPeriodsLoading] = useState(false);

  const fetchTimetable = async () => {
    setIsLoading(true);
    const token = window.localStorage.getItem("authToken");
    const params = new URLSearchParams();
    params.set("week", weekKey);
    if (filterClassId) params.set("classId", filterClassId);
    if (filterTeacherId) params.set("teacherId", filterTeacherId);
    if (filterSubjectId) params.set("subjectId", filterSubjectId);
    const response = await fetch(apiUrl(`/api/timetable?${params.toString()}`), {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (response.ok) {
      const data = await response.json();
      setPeriods(data.periods ?? []);
      setAssignments(data.assignments ?? []);
      setTeachers(data.teachers ?? []);
      setSubjects(data.subjects ?? []);
      setClasses(data.classes ?? []);
    }
    setIsLoading(false);
  };

  const loadClassSetup = async (classIdValue: string) => {
    setIsPeriodsLoading(true);
    const token = window.localStorage.getItem("authToken");
    const classParam = classIdValue ? `?classId=${classIdValue}` : "";
    const response = await fetch(apiUrl(`/api/timetable/periods${classParam}`), {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (response.ok) {
      setClassSetupPeriods(await response.json());
    }
    setIsPeriodsLoading(false);
  };

  const loadClassList = async () => {
    const token = window.localStorage.getItem("authToken");
    const response = await fetch(apiUrl("/api/classes/manage"), {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (response.ok) {
      setClassSetupClasses(await response.json());
    }
  };

  useEffect(() => {
    fetchTimetable();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekKey, filterClassId, filterTeacherId, filterSubjectId]);

  useEffect(() => {
    if (!classes.length) return;
    if (!activeClassCode || activeClassCode === "all") {
      setFilterClassId("");
      setSetupClassId("");
      setTablePeriodClassId("");
      return;
    }
    const match = classes.find((c) => c.classCode === activeClassCode);
    const id = match ? String(match.id) : "";
    setFilterClassId(id);
    setSetupClassId(id);
    setTablePeriodClassId(id);
  }, [activeClassCode, classes]);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(null), 2000);
    return () => window.clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    if (activeTab === "Manage Period") {
      loadClassSetup(tablePeriodClassId);
      loadClassList();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, tablePeriodClassId]);

  const activePeriods = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return periods.filter((p) => {
      if (!p.startDate && !p.endDate) return true;
      if (p.startDate && today < p.startDate) return false;
      if (p.endDate && today > p.endDate) return false;
      return true;
    });
  }, [periods]);

  const periodsByNo = useMemo(() => {
    const map = new Map<number, Period[]>();
    activePeriods.forEach((period) => {
      const list = map.get(period.periodNo) ?? [];
      list.push(period);
      map.set(period.periodNo, list);
    });
    return Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([periodNo, items]) => ({
        periodNo,
        items,
      }));
  }, [activePeriods]);

  const periodMap = useMemo(() => {
    const map = new Map<string, Period>();
    activePeriods.forEach((period) => {
      map.set(`${period.dayOfWeek}-${period.periodNo}`, period);
    });
    return map;
  }, [activePeriods]);

  const assignmentMap = useMemo(() => {
    const map = new Map<string, Assignment>();
    assignments.forEach((assignment) => {
      map.set(`${assignment.periodId}-${assignment.classId}`, assignment);
    });
    return map;
  }, [assignments]);

  const teacherMap = useMemo(() => {
    const map = new Map<number, Teacher>();
    teachers.forEach((teacher) => map.set(teacher.id, teacher));
    return map;
  }, [teachers]);

  const subjectMap = useMemo(() => {
    const map = new Map<number, Subject>();
    subjects.forEach((subject) => map.set(subject.id, subject));
    return map;
  }, [subjects]);

  const canEdit = Boolean(filterClassId);

  const handleSave = async (
    assignmentId: number | undefined,
    classId: number,
    periodId: number,
    teacherId: number,
    subjectId: number
  ) => {
    const token = window.localStorage.getItem("authToken");
    const payload = {
      teacherId,
      classId,
      subjectId,
      periodId,
      weekKey,
    };
    const response = await fetch(
      apiUrl(assignmentId ? `/api/timetable/${assignmentId}` : "/api/timetable"),
      {
        method: assignmentId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      }
    );
    if (response.ok) {
      setMessage("Saved successfully.");
      fetchTimetable();
      setPending((prev) => {
        const next = { ...prev };
        delete next[`${periodId}-${classId}`];
        return next;
      });
    } else {
      const err = await response.json().catch(() => ({}));
      setMessage(err?.message ?? err?.error ?? "Conflict detected.");
    }
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSaveAll = async () => {
    if (!filterClassId) {
      setMessage("Select a class to edit.");
      return;
    }
    const classId = Number(filterClassId);
    const incomplete: string[] = [];
    const updates = Object.entries(pending)
      .map(([key, value]) => {
        const [periodIdValue] = key.split("-").map((v) => Number(v));
        const existing = assignmentMap.get(`${periodIdValue}-${classId}`);
        const teacherId = value.teacherId ?? existing?.teacherId;
        const subjectId = value.subjectId ?? existing?.subjectId;
        if (!periodIdValue) return null;
        if (!teacherId || !subjectId) {
          const period = periods.find((p) => p.id === periodIdValue);
          const label = period ? `Period ${period.periodNo} (${period.dayOfWeek})` : `Period`;
          if (!teacherId && !subjectId) incomplete.push(`${label}: select teacher and subject`);
          else if (!teacherId) incomplete.push(`${label}: select a teacher`);
          else incomplete.push(`${label}: select a subject`);
          return null;
        }
        return {
          teacherId,
          classId,
          subjectId,
          periodId: periodIdValue,
          weekKey,
        };
      })
      .filter(Boolean) as Array<{
      teacherId: number;
      classId: number;
      subjectId: number;
      periodId: number;
      weekKey: string;
    }>;
    if (incomplete.length > 0 && updates.length === 0) {
      setMessage(incomplete.join("; "));
      return;
    }
    if (updates.length === 0) {
      setMessage("No changes to save.");
      return;
    }
    if (incomplete.length > 0) {
      setMessage(`Saving ${updates.length} complete assignment(s). Skipped: ${incomplete.join("; ")}`);
    }
    setIsSaving(true);
    const token = window.localStorage.getItem("authToken");
    const response = await fetch(apiUrl("/api/timetable/bulk"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ weekKey, assignments: updates }),
    });
    if (response.ok) {
      setMessage("Timetable saved successfully.");
      setPending({});
      setIsEditMode(false);
      fetchTimetable();
    } else {
      const err = await response.json().catch(() => ({}));
      setMessage(err?.message ?? err?.error ?? "Failed to save timetable.");
    }
    setIsSaving(false);
  };

  const handleDownloadPdf = () => {
    if (!filterClassId) {
      setMessage("Select a class first.");
      return;
    }
    const classId = Number(filterClassId);
    const classItem = classes.find((c) => c.id === classId);
    const title = classItem ? `Timetable - ${classItem.classCode}` : "Timetable";
    const tableRows = periodsByNo
      .map((row) => {
        const cells = days
          .map((day) => {
            const period = periodMap.get(`${day}-${row.periodNo}`);
            if (!period) return "<td>-</td>";
            const assignment = assignmentMap.get(`${period.id}-${classId}`);
            if (!assignment) return "<td>-</td>";
            const teacher = teacherMap.get(assignment.teacherId);
            const subject = subjectMap.get(assignment.subjectId);
            return `<td><div><strong>${teacher?.name ?? "-"}</strong></div><div>${subject?.name ?? ""}</div></td>`;
          })
          .join("");
        const sample = row.items[0];
        const timeLabel = sample ? `<br><small style="font-weight:normal;color:#64748b">${sample.startTime} - ${sample.endTime}</small>` : "";
        return `<tr><th>Period ${row.periodNo}${timeLabel}</th>${cells}</tr>`;
      })
      .join("");

    const html = `<!doctype html>
<html>
  <head>
    <title>${title}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 24px; }
      h1 { font-size: 20px; margin-bottom: 12px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; vertical-align: top; }
      th { background: #f8fafc; }
    </style>
  </head>
  <body>
    <h1>${title}</h1>
    <table>
      <thead>
        <tr>
          <th>Period</th>
          ${days.map((d) => `<th>${d}</th>`).join("")}
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
  </body>
</html>`;
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(html);
    doc.close();
    iframe.onload = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 500);
    };
  };

  return (
    <div className={styles.form}>
      <div className={styles.sectionTitle}>Timetable Management</div>
      <div className={styles.tabs}>
        {(isAdmin ? ["Timetable", "Manage Period"] : ["Timetable"]).map((tab) => (
          <button
            key={tab}
            type="button"
            className={`${styles.tab} ${tab === activeTab ? styles.tabActive : ""}`}
            onClick={() =>
              setActiveTab(tab as "Timetable" | "Manage Period")
            }
          >
            {tab}
          </button>
        ))}
      </div>
      {activeTab === "Timetable" && isAdmin ? (
        <div className={styles.fieldGrid}>
          <label className={styles.label}>
            View by Teacher
            <select
              className={styles.input}
              value={filterTeacherId}
              onChange={(e) => setFilterTeacherId(e.target.value)}
            >
              <option value="">All</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.label}>
            View by Subject
            <select
              className={styles.input}
              value={filterSubjectId}
              onChange={(e) => setFilterSubjectId(e.target.value)}
            >
              <option value="">All</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}

      {message ? <div className={styles.success}>{message}</div> : null}

      {activeTab === "Manage Period" ? (
        <div className={styles.profileSection}>
          <div className={styles.sectionTitle}>Class Periods</div>
          <div className={styles.fieldGrid}>
            <label className={styles.label}>
              Class <span className={styles.requiredMark}>*</span>
              <select
                className={styles.input}
                value={setupClassId}
                onChange={(e) => setSetupClassId(e.target.value)}
              >
                <option value="">All</option>
                {classSetupClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.classCode}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.label}>
              Day <span className={styles.requiredMark}>*</span>
              <select
                className={styles.input}
                value={periodDay}
                onChange={(e) => setPeriodDay(e.target.value)}
              >
                {days.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.label}>
              Period No <span className={styles.requiredMark}>*</span>
              <input
                className={styles.input}
                type="number"
                min={1}
                value={periodNo}
                onChange={(e) => setPeriodNo(Number(e.target.value))}
              />
            </label>
            <label className={styles.label}>
              Start Time <span className={styles.requiredMark}>*</span>
              <input
                className={styles.input}
                type="time"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
              />
            </label>
            <label className={styles.label}>
              End Time <span className={styles.requiredMark}>*</span>
              <input
                className={styles.input}
                type="time"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
              />
            </label>
            <label className={styles.label}>
              Start Date
              <input
                className={styles.input}
                type="date"
                value={periodStartDate}
                onChange={(e) => setPeriodStartDate(e.target.value)}
              />
            </label>
            <label className={styles.label}>
              End Date
              <input
                className={styles.input}
                type="date"
                value={periodEndDate}
                onChange={(e) => setPeriodEndDate(e.target.value)}
              />
            </label>
          </div>
          <div className={styles.formActions}>
            <button
              className={styles.button}
              type="button"
              onClick={async () => {
                if (!setupClassId) {
                  setMessage("Select class first.");
                  return;
                }
                if (periodNo < 1) {
                  setMessage("Period number must be 1 or greater.");
                  return;
                }
                if (periodStart >= periodEnd) {
                  setMessage("End time must be after start time.");
                  return;
                }
                if (periodStartDate && periodEndDate && periodEndDate < periodStartDate) {
                  setMessage("End date must be on or after start date.");
                  return;
                }
                setIsPeriodSaving(true);
                const token = window.localStorage.getItem("authToken");
                const response = await fetch(
                  apiUrl(
                    editingPeriodId
                      ? `/api/timetable/periods/${editingPeriodId}`
                      : "/api/timetable/periods"
                  ),
                  {
                    method: editingPeriodId ? "PUT" : "POST",
                    headers: {
                      "Content-Type": "application/json",
                      ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify({
                      classId: Number(setupClassId),
                      dayOfWeek: periodDay,
                      periodNo,
                      startTime: periodStart,
                      endTime: periodEnd,
                      startDate: periodStartDate || null,
                      endDate: periodEndDate || null,
                    }),
                  }
                );
                if (response.ok) {
                  setEditingPeriodId(null);
                  setPeriodStartDate("");
                  setPeriodEndDate("");
                  setMessage("Period saved.");
                  loadClassSetup(tablePeriodClassId);
                } else {
                  const err = await response.json().catch(() => ({}));
                  setMessage(err?.message ?? err?.error ?? "Unable to save period.");
                }
                setIsPeriodSaving(false);
              }}
              disabled={isPeriodSaving}
            >
              {isPeriodSaving
                ? "Saving..."
                : editingPeriodId
                ? "Update Period"
                : "Save Period"}
            </button>
          </div>
          <div className={styles.tableResponsive}>
            {isPeriodsLoading ? (
              <div className={styles.loadingCard}>
                <div className={styles.skeletonTitle} />
                <div className={styles.skeletonLine} />
                <div className={styles.skeletonLine} />
                <div className={styles.skeletonLine} />
              </div>
            ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Class</th>
                  <th>Day</th>
                  <th>Period</th>
                  <th>Time</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {classSetupPeriods.map((period, index) => (
                  <tr key={period.id}>
                    <td>{index + 1}</td>
                    <td>{period.classCode ?? "-"}</td>
                    <td>{period.dayOfWeek}</td>
                    <td>{period.periodNo}</td>
                    <td>
                      {period.startTime} - {period.endTime}
                    </td>
                    <td>{period.startDate ?? "-"}</td>
                    <td>{period.endDate ?? "-"}</td>
                    <td>
                      <button
                        className={styles.inlineButton}
                        type="button"
                        onClick={() => {
                          setEditingPeriodId(period.id);
                          setPeriodDay(period.dayOfWeek);
                          setPeriodNo(period.periodNo);
                          setPeriodStart(period.startTime);
                          setPeriodEnd(period.endTime);
                          setPeriodStartDate(period.startDate ?? "");
                          setPeriodEndDate(period.endDate ?? "");
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className={styles.inlineButton}
                        type="button"
                        onClick={async () => {
                          const token = window.localStorage.getItem("authToken");
                          const response = await fetch(
                            apiUrl(`/api/timetable/periods/${period.id}`),
                            {
                              method: "DELETE",
                              headers: token
                                ? { Authorization: `Bearer ${token}` }
                                : undefined,
                            }
                          );
                          if (response.ok) {
                            setMessage("Period deleted.");
                            loadClassSetup(tablePeriodClassId);
                          } else {
                            setMessage("Unable to delete period.");
                          }
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            )}
          </div>
        </div>
      ) : isLoading ? (
        <div className={styles.loadingCard}>
          <div className={styles.skeletonTitle} />
          <div className={styles.skeletonLine} />
          <div className={styles.skeletonLine} />
        </div>
      ) : !filterClassId ? (
        <div className={styles.listLayout}>
          <div className={styles.sectionTitle}>Select a Class</div>
          <div className={styles.cardGrid}>
            {classes.map((c) => (
              <button
                key={c.id}
                className={styles.cardButton}
                type="button"
                onClick={() => {
                  if (onSelectClass) {
                    onSelectClass(c.classCode);
                  } else {
                    setFilterClassId(String(c.id));
                  }
                }}
              >
                <div className={styles.cardTitle}>{c.classCode}</div>
                <div className={styles.cardMeta}>
                  {c.name} {c.section}
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className={styles.timetableWrapper}>
                  <div className={styles.formActions}>
                    {isAdmin ? (
                      <button
                        className={styles.button}
                        type="button"
                        onClick={() => setIsEditMode(true)}
                        disabled={isEditMode}
                      >
                        Edit Timetable
                      </button>
                    ) : null}
                    <button
                      className={styles.inlineButton}
                      type="button"
                      onClick={handleDownloadPdf}
                    >
                      Download PDF
                    </button>
                    {isAdmin ? (
                      <button
                        className={styles.button}
                        type="button"
                        onClick={handleSaveAll}
                        disabled={!isEditMode || isSaving}
                      >
                        {isSaving ? "Saving..." : "Save Changes"}
                      </button>
                    ) : null}
                  </div>
                  <div className={styles.timetableGrid}>
                    <div className={styles.timetableHeader}>Period</div>
                    {days.map((day) => (
                      <div key={day} className={styles.timetableHeader}>
                        {day}
                      </div>
                    ))}
        
                    {periodsByNo.map((row) => {
                      const sample = row.items[0];
                      return (
                        <div key={`row-${row.periodNo}`} className={styles.timetableRow}>
                          <div className={styles.timetablePeriod}>
                            <div>Period {row.periodNo}</div>
                            {sample ? (
                              <>
                                <small>
                                  {sample.startTime} - {sample.endTime}
                                </small>
                                {sample.startDate || sample.endDate ? (
                                  <small style={{ opacity: 0.7 }}>
                                    {sample.startDate ?? ""} {sample.startDate && sample.endDate ? "to" : ""} {sample.endDate ?? ""}
                                  </small>
                                ) : null}
                              </>
                            ) : null}
                          </div>
                          {days.map((day) => {
                            const period = periodMap.get(`${day}-${row.periodNo}`);
                            if (!period) {
                              return (
                                <div key={`${day}-${row.periodNo}`} className={styles.timetableCell}>
                                  -
                                </div>
                              );
                            }
                            const classId = filterClassId ? Number(filterClassId) : 0;
                            const assignment =
                              classId > 0 ? assignmentMap.get(`${period.id}-${classId}`) : undefined;
                            const teacher = assignment ? teacherMap.get(assignment.teacherId) : undefined;
                            const subject = assignment ? subjectMap.get(assignment.subjectId) : undefined;
                            const pendingKey = `${period.id}-${classId}`;
                            const pendingValue = pending[pendingKey] ?? {};
                            const effectiveTeacherId = pendingValue.teacherId ?? assignment?.teacherId ?? "";
                            const effectiveSubjectId = pendingValue.subjectId ?? assignment?.subjectId ?? "";
                            return (
                              <div key={`${day}-${row.periodNo}`} className={styles.timetableCell}>
                                {canEdit && isEditMode ? (
                                  <>
                                    <select
                                      className={styles.input}
                                      value={effectiveTeacherId}
                                      onChange={(e) => {
                                        const teacherId = Number(e.target.value);
                                        setPending((prev) => ({
                                          ...prev,
                                          [pendingKey]: { ...prev[pendingKey], teacherId },
                                        }));
                                      }}
                                    >
                                      <option value="">Teacher</option>
                                      {teachers.map((t) => (
                                        <option key={t.id} value={t.id}>
                                          {t.name}
                                        </option>
                                      ))}
                                    </select>
                                    <select
                                      className={styles.input}
                                      value={effectiveSubjectId}
                                      onChange={(e) => {
                                        const subjectId = Number(e.target.value);
                                        setPending((prev) => ({
                                          ...prev,
                                          [pendingKey]: { ...prev[pendingKey], subjectId },
                                        }));
                                      }}
                                    >
                                      <option value="">Subject</option>
                                      {subjects.map((s) => (
                                        <option key={s.id} value={s.id}>
                                          {s.name}
                                        </option>
                                      ))}
                                    </select>
                                  </>
                                ) : (
                                  <div className={styles.timetableCellLabel}>
                                    <div>{teacher?.name ?? "-"}</div>
                                    <div style={{ color: subject?.color ?? "#64748b" }}>
                                      {subject?.name ?? ""}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>)}
    </div>
  );
}