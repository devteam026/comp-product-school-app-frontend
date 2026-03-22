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
};

export default function TimetableManagement({
  activeClassCode,
  onSelectClass,
}: TimetableManagementProps) {
  const [activeTab, setActiveTab] = useState<
    "Timetable" | "Manage Period" | "Add Class"
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
  const [classSetupSubjects, setClassSetupSubjects] = useState<Subject[]>([]);
  const [classSetupPeriods, setClassSetupPeriods] = useState<Period[]>([]);
  const [classSetupClasses, setClassSetupClasses] = useState<ClassManage[]>([]);
  const [setupClassId, setSetupClassId] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [subjectColor, setSubjectColor] = useState("#64748b");
  const [editingSubjectId, setEditingSubjectId] = useState<number | null>(null);
  const [periodDay, setPeriodDay] = useState("MON");
  const [periodNo, setPeriodNo] = useState(1);
  const [periodStart, setPeriodStart] = useState("09:00");
  const [periodEnd, setPeriodEnd] = useState("09:45");
  const [editingPeriodId, setEditingPeriodId] = useState<number | null>(null);
  const [isPeriodSaving, setIsPeriodSaving] = useState(false);
  const [classCode, setClassCode] = useState("");
  const [className, setClassName] = useState("");
  const [classSection, setClassSection] = useState("");
  const [editingClassId, setEditingClassId] = useState<number | null>(null);

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
    if (!classIdValue) {
      setClassSetupSubjects([]);
      setClassSetupPeriods([]);
      return;
    }
    const token = window.localStorage.getItem("authToken");
    const [subjectRes, periodRes] = await Promise.all([
      fetch(apiUrl(`/api/timetable/subjects?classId=${classIdValue}`), {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }),
      fetch(apiUrl(`/api/timetable/periods?classId=${classIdValue}`), {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }),
    ]);
    if (subjectRes.ok) {
      setClassSetupSubjects(await subjectRes.json());
    }
    if (periodRes.ok) {
      setClassSetupPeriods(await periodRes.json());
    }
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
      return;
    }
    const match = classes.find((c) => c.classCode === activeClassCode);
    setFilterClassId(match ? String(match.id) : "");
    setSetupClassId(match ? String(match.id) : "");
  }, [activeClassCode, classes]);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(null), 2000);
    return () => window.clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    if ((activeTab === "Manage Period" || activeTab === "Add Class") && setupClassId) {
      loadClassSetup(setupClassId);
    }
    if (activeTab === "Manage Period" || activeTab === "Add Class") {
      loadClassList();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, setupClassId]);

  const periodsByNo = useMemo(() => {
    const map = new Map<number, Period[]>();
    periods.forEach((period) => {
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
  }, [periods]);

  const periodMap = useMemo(() => {
    const map = new Map<string, Period>();
    periods.forEach((period) => {
      map.set(`${period.dayOfWeek}-${period.periodNo}`, period);
    });
    return map;
  }, [periods]);

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
    const updates = Object.entries(pending)
      .map(([key, value]) => {
        const [periodIdValue] = key.split("-").map((v) => Number(v));
        const teacherId = value.teacherId;
        const subjectId = value.subjectId;
        if (!teacherId || !subjectId || !periodIdValue) return null;
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
    if (updates.length === 0) {
      setMessage("No changes to save.");
      return;
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
        return `<tr><th>Period ${row.periodNo}</th>${cells}</tr>`;
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
        {["Timetable", "Manage Period", "Add Class"].map((tab) => (
          <button
            key={tab}
            type="button"
            className={`${styles.tab} ${tab === activeTab ? styles.tabActive : ""}`}
            onClick={() =>
              setActiveTab(tab as "Timetable" | "Manage Period" | "Add Class")
            }
          >
            {tab}
          </button>
        ))}
      </div>
      {activeTab === "Timetable" ? (
        <div className={styles.fieldGrid}>
          <label className={styles.label}>
            Week Key
            <input
              className={styles.input}
              value={weekKey}
              onChange={(e) => setWeekKey(e.target.value)}
            />
          </label>
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

      {activeTab === "Add Class" ? (
        <div className={styles.listLayout}>
          <div className={styles.profileSection}>
            <div className={styles.sectionTitle}>Class Details</div>
            <div className={styles.fieldGrid}>
              <label className={styles.label}>
                Class Code <span className={styles.requiredMark}>*</span>
                <input
                  className={styles.input}
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value)}
                />
              </label>
              <label className={styles.label}>
                Class Name <span className={styles.requiredMark}>*</span>
                <input
                  className={styles.input}
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                />
              </label>
              <label className={styles.label}>
                Section
                <input
                  className={styles.input}
                  value={classSection}
                  onChange={(e) => setClassSection(e.target.value)}
                />
              </label>
            </div>
            <div className={styles.formActions}>
              <button
                className={styles.button}
                type="button"
                onClick={async () => {
                  if (!classCode.trim() || !className.trim()) {
                    setMessage("Class code and name are required.");
                    return;
                  }
                  const token = window.localStorage.getItem("authToken");
                  const response = await fetch(
                    apiUrl(
                      editingClassId
                        ? `/api/classes/manage/${editingClassId}`
                        : "/api/classes/manage"
                    ),
                    {
                      method: editingClassId ? "PUT" : "POST",
                      headers: {
                        "Content-Type": "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                      },
                      body: JSON.stringify({
                        classCode: classCode.trim(),
                        name: className.trim(),
                        section: classSection.trim() || null,
                      }),
                    }
                  );
                  if (response.ok) {
                    setMessage(
                      editingClassId ? "Class updated." : "Class saved."
                    );
                    setClassCode("");
                    setClassName("");
                    setClassSection("");
                    setEditingClassId(null);
                    loadClassList();
                    fetchTimetable();
                  } else {
                    setMessage("Unable to save class.");
                  }
                }}
              >
                {editingClassId ? "Update Class" : "Save Class"}
              </button>
            </div>
            <div className={styles.tableResponsive}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Class Code</th>
                    <th>Name</th>
                    <th>Section</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {classSetupClasses.map((c, index) => (
                    <tr key={c.id}>
                      <td>{index + 1}</td>
                      <td>{c.classCode}</td>
                      <td>{c.name}</td>
                      <td>{c.section ?? "-"}</td>
                      <td>
                        <button
                          className={styles.inlineButton}
                          type="button"
                          onClick={() => {
                            setEditingClassId(c.id);
                            setClassCode(c.classCode);
                            setClassName(c.name);
                            setClassSection(c.section ?? "");
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
                              apiUrl(`/api/classes/manage/${c.id}`),
                              {
                                method: "DELETE",
                                headers: token
                                  ? { Authorization: `Bearer ${token}` }
                                  : undefined,
                              }
                            );
                            if (response.ok) {
                              setMessage("Class deleted.");
                              loadClassList();
                              fetchTimetable();
                            } else {
                              setMessage("Unable to delete class.");
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
            </div>
          </div>
          <div className={styles.profileSection}>
            <div className={styles.sectionTitle}>Class Subjects</div>
            <div className={styles.fieldGrid}>
              <label className={styles.label}>
                Class <span className={styles.requiredMark}>*</span>
                <select
                  className={styles.input}
                  value={setupClassId}
                  onChange={(e) => {
                    setSetupClassId(e.target.value);
                    loadClassSetup(e.target.value);
                  }}
                >
                  <option value="">Select</option>
                  {classSetupClasses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.classCode}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.label}>
                Subject Name <span className={styles.requiredMark}>*</span>
                <input
                  className={styles.input}
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                />
              </label>
              <label className={styles.label}>
                Color
                <input
                  className={styles.input}
                  type="color"
                  value={subjectColor}
                  onChange={(e) => setSubjectColor(e.target.value)}
                />
              </label>
            </div>
            <div className={styles.formActions}>
              <button
                className={styles.button}
                type="button"
                onClick={async () => {
                  if (!setupClassId || !subjectName.trim()) {
                    setMessage("Select class and subject name.");
                    return;
                  }
                  const token = window.localStorage.getItem("authToken");
                  const response = await fetch(
                    apiUrl(
                      editingSubjectId
                        ? `/api/timetable/subjects/${editingSubjectId}`
                        : "/api/timetable/subjects"
                    ),
                    {
                      method: editingSubjectId ? "PUT" : "POST",
                      headers: {
                        "Content-Type": "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                      },
                      body: JSON.stringify({
                        classId: Number(setupClassId),
                        name: subjectName.trim(),
                        color: subjectColor,
                      }),
                    }
                  );
                  if (response.ok) {
                    setSubjectName("");
                    setEditingSubjectId(null);
                    setMessage("Subject saved.");
                    loadClassSetup(setupClassId);
                  } else {
                    setMessage("Unable to save subject.");
                  }
                }}
              >
                {editingSubjectId ? "Update Subject" : "Save Subject"}
              </button>
            </div>
            <div className={styles.tableResponsive}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Color</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {classSetupSubjects.map((subject, index) => (
                    <tr key={subject.id}>
                      <td>{index + 1}</td>
                      <td>{subject.name}</td>
                      <td>
                        <span
                          className={styles.colorSwatch}
                          style={{ background: subject.color ?? "#cbd5f5" }}
                        />
                      </td>
                      <td>
                        <button
                          className={styles.inlineButton}
                          type="button"
                          onClick={() => {
                            setEditingSubjectId(subject.id);
                            setSubjectName(subject.name);
                            setSubjectColor(subject.color ?? "#64748b");
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
                              apiUrl(`/api/timetable/subjects/${subject.id}`),
                              {
                                method: "DELETE",
                                headers: token
                                  ? { Authorization: `Bearer ${token}` }
                                  : undefined,
                              }
                            );
                            if (response.ok) {
                              setMessage("Subject deleted.");
                              loadClassSetup(setupClassId);
                            } else {
                              setMessage("Unable to delete subject.");
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
            </div>
          </div>
        </div>
      ) : activeTab === "Manage Period" ? (
        <div className={styles.profileSection}>
          <div className={styles.sectionTitle}>Class Periods</div>
          <div className={styles.fieldGrid}>
            <label className={styles.label}>
              Class <span className={styles.requiredMark}>*</span>
              <select
                className={styles.input}
                value={setupClassId}
                onChange={(e) => {
                  setSetupClassId(e.target.value);
                  loadClassSetup(e.target.value);
                }}
              >
                <option value="">Select</option>
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
                    }),
                  }
                );
                if (response.ok) {
                  setEditingPeriodId(null);
                  setMessage("Period saved.");
                  loadClassSetup(setupClassId);
                } else {
                  setMessage("Unable to save period.");
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
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Day</th>
                  <th>Period</th>
                  <th>Time</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {classSetupPeriods.map((period, index) => (
                  <tr key={period.id}>
                    <td>{index + 1}</td>
                    <td>{period.dayOfWeek}</td>
                    <td>{period.periodNo}</td>
                    <td>
                      {period.startTime} - {period.endTime}
                    </td>
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
                            loadClassSetup(setupClassId);
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
                    <button
                      className={styles.button}
                      type="button"
                      onClick={() => setIsEditMode(true)}
                      disabled={isEditMode}
                    >
                      Edit Timetable
                    </button>
                    <button
                      className={styles.inlineButton}
                      type="button"
                      onClick={handleDownloadPdf}
                    >
                      Download PDF
                    </button>
                    <button
                      className={styles.button}
                      type="button"
                      onClick={handleSaveAll}
                      disabled={!isEditMode || isSaving}
                    >
                      {isSaving ? "Saving..." : "Save Changes"}
                    </button>
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
                              <small>
                                {sample.startTime} - {sample.endTime}
                              </small>
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