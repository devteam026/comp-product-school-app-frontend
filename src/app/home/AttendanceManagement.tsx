"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "../styles/home.module.css";
import type { Student } from "./data";
import StudentProfileModal from "./StudentProfileModal";
import { apiUrl } from "../../lib/api";

type AttendanceManagementProps = {
  students: Student[];
  isLoading?: boolean;
};

type Status = "Present" | "Absent";

const sortFields = ["name", "classCode", "rollNumber", "status"] as const;
const pageSizeOptions = [10, 25, 50] as const;
const tabs = ["Take Attendance", "View Attendance"] as const;

type SortField = (typeof sortFields)[number];

type Tab = (typeof tabs)[number];

export default function AttendanceManagement({
  students,
  isLoading,
}: AttendanceManagementProps) {
  const [activeTab, setActiveTab] = useState<Tab>("Take Attendance");
  const [attendanceDate, setAttendanceDate] = useState(
    () => new Date().toISOString().slice(0, 10)
  );
  const [attendance, setAttendance] = useState<Record<string, Status>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isAttendanceLoading, setIsAttendanceLoading] = useState(false);
  const todayDate = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const isAttendanceDateLocked = attendanceDate !== todayDate;

  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("all");
  const [filterGender, setFilterGender] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState("asc");
  const [pageSize, setPageSize] = useState<(typeof pageSizeOptions)[number]>(10);
  const [page, setPage] = useState(1);
  const activeStudents = useMemo(
    () => students.filter((student) => student.status === "Active"),
    [students]
  );

  const classOptions = useMemo(() => {
    return Array.from(
      new Set(activeStudents.map((student) => student.classCode))
    ).sort();
  }, [activeStudents]);

  const allPresent = useMemo(() => {
    if (activeStudents.length === 0) return false;
    return activeStudents.every((student) => attendance[student.id] !== "Absent");
  }, [activeStudents, attendance]);

  const handleMarkAllPresent = () => {
    const updated: Record<string, Status> = {};
    activeStudents.forEach((student) => {
      updated[student.id] = "Present";
    });
    setAttendance(updated);
  };

  const handleToggleAbsent = (studentId: string) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === "Absent" ? "Present" : "Absent",
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const token = window.localStorage.getItem("authToken");
      const records = filteredStudents.map((student) => ({
        studentId: student.id,
        status: attendance[student.id] ?? "Present",
      }));
      const response = await fetch(apiUrl("/api/attendance"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          date: attendanceDate,
          records,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to save attendance");
      }
      const data = await response.json().catch(() => null);
      setSaveMessage(
        data?.ok ? "Attendance saved successfully." : "Attendance saved."
      );
      loadAttendance(attendanceDate);
    } catch {
      setSaveMessage("Unable to save attendance. Try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const loadAttendance = async (date: string) => {
    setIsAttendanceLoading(true);
    const token = window.localStorage.getItem("authToken");
    const response = await fetch(apiUrl(`/api/attendance?date=${date}`), {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (response.ok) {
      const data = await response.json().catch(() => null);
      if (data?.records) {
        const map: Record<string, Status> = {};
        data.records.forEach((record: { studentId: string; status: Status }) => {
          map[record.studentId] = record.status;
        });
        setAttendance(map);
      }
    }
    setIsAttendanceLoading(false);
  };

  useEffect(() => {
    loadAttendance(attendanceDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attendanceDate]);

  useEffect(() => {
    if (!saveMessage) return;
    const timer = window.setTimeout(() => {
      setSaveMessage(null);
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [saveMessage]);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    return activeStudents.filter((student) => {
      const status: Status = attendance[student.id] ?? "Present";
      const matchesQuery =
        query.length === 0 ||
        student.name.toLowerCase().includes(query) ||
        student.rollNumber.toLowerCase().includes(query);
      const matchesClass =
        filterClass === "all" || student.classCode === filterClass;
      const matchesGender =
        filterGender === "all" || student.gender === filterGender;
      const matchesStatus =
        filterStatus === "all" || status === filterStatus;
      return matchesQuery && matchesClass && matchesGender && matchesStatus;
    });
  }, [activeStudents, attendance, search, filterClass, filterGender, filterStatus]);

  const presentCount = useMemo(() => {
    return filteredStudents.filter((student) => attendance[student.id] !== "Absent")
      .length;
  }, [filteredStudents, attendance]);

  const absentCount = useMemo(() => {
    return filteredStudents.filter((student) => attendance[student.id] === "Absent")
      .length;
  }, [filteredStudents, attendance]);

  const sortedStudents = useMemo(() => {
    const sorted = [...filteredStudents].sort((a, b) => {
      const aValue =
        sortField === "status"
          ? attendance[a.id] ?? "Present"
          : String(a[sortField] ?? "");
      const bValue =
        sortField === "status"
          ? attendance[b.id] ?? "Present"
          : String(b[sortField] ?? "");
      return sortDir === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });
    return sorted;
  }, [filteredStudents, attendance, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedStudents.length / pageSize));
  const pagedStudents = sortedStudents.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  return (
    <div className={styles.form}>
      <div className={styles.tabs}>
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`${styles.tab} ${tab === activeTab ? styles.tabActive : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "View Attendance" ? (
        <div>
          <div className={styles.fieldGrid}>
            <label className={styles.label}>
              Date
              <input
                className={styles.input}
                type="date"
                value={attendanceDate}
                onChange={(event) => setAttendanceDate(event.target.value)}
              />
            </label>
          </div>
          {isLoading || isAttendanceLoading ? (
            <div className={styles.loadingCard}>
              <div className={styles.skeletonTitle} />
              <div className={styles.skeletonLine} />
              <div className={styles.skeletonLine} />
            </div>
          ) : activeStudents.length === 0 ? (
            <div className={styles.empty}>No students available.</div>
          ) : (
            <>
              <div className={styles.fieldRow}>
                <div>
                  <strong>Present:</strong> {presentCount} &nbsp; <strong>Absent:</strong> {absentCount} &nbsp; <strong>Total:</strong> {filteredStudents.length}
                </div>
              </div>
              <div className={styles.tableResponsive}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Student</th>
                      <th>Class</th>
                      <th>Roll #</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student, index) => {
                      const status: Status = attendance[student.id] ?? "Present";
                      return (
                        <tr key={student.id}>
                          <td>{index + 1}</td>
                          <td
                            className={styles.rowClickable}
                            onClick={() => setSelectedStudent(student)}
                          >
                            {student.name}
                          </td>
                          <td>{student.classCode}</td>
                          <td>{student.rollNumber || "-"}</td>
                          <td>
                            <span
                              className={
                                status === "Present"
                                  ? styles.statusPresent
                                  : styles.statusAbsent
                              }
                            >
                              {status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      ) : isLoading || isAttendanceLoading ? (
        <div className={styles.loadingCard}>
          <div className={styles.skeletonTitle} />
          <div className={styles.skeletonLine} />
          <div className={styles.skeletonLine} />
          <div className={styles.skeletonTable}>
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className={styles.skeletonRow}>
                <span />
                <span />
                <span />
                <span />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className={styles.listToolbar}>
            <input
              className={styles.searchInput}
              type="search"
              placeholder="Search name or roll #"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
            <div className={styles.filterRow}>
              <select
                className={styles.inlineSelect}
                value={filterClass}
                onChange={(event) => {
                  setFilterClass(event.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All Classes</option>
                {classOptions.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
              <select
                className={styles.inlineSelect}
                value={filterGender}
                onChange={(event) => {
                  setFilterGender(event.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              <select
                className={styles.inlineSelect}
                value={filterStatus}
                onChange={(event) => {
                  setFilterStatus(event.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All Status</option>
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
              </select>
              <select
                className={styles.inlineSelect}
                value={sortField}
                onChange={(event) => setSortField(event.target.value as SortField)}
              >
                {sortFields.map((field) => (
                  <option key={field} value={field}>
                    Sort by {field}
                  </option>
                ))}
              </select>
              <button
                className={styles.inlineButton}
                type="button"
                onClick={() => setSortDir((prev) => (prev === "asc" ? "desc" : "asc"))}
              >
                {sortDir === "asc" ? "Asc" : "Desc"}
              </button>
              <select
                className={styles.inlineSelect}
                value={pageSize}
                onChange={(event) => {
                  setPageSize(
                    Number(event.target.value) as (typeof pageSizeOptions)[number]
                  );
                  setPage(1);
                }}
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size} / page
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.fieldRow}>
            <label className={styles.label}>
              Date
              <input
                className={styles.input}
                type="date"
                value={attendanceDate}
                onChange={(event) => setAttendanceDate(event.target.value)}
              />
            </label>
            <div className={styles.inlineActions}>
              <button
                className={styles.inlineButton}
                type="button"
                onClick={handleMarkAllPresent}
                disabled={students.length === 0 || allPresent}
              >
                Mark All Present
              </button>
              <button
                className={styles.button}
                type="button"
                onClick={() => setShowConfirm(true)}
                disabled={students.length === 0 || isSaving || isAttendanceDateLocked}
              >
                {isSaving ? "Saving..." : "Save Attendance"}
              </button>
            </div>
          </div>

          {isAttendanceDateLocked ? (
            <div className={styles.notice}>
              Attendance can only be saved for today ({todayDate}).
            </div>
          ) : null}
          {saveMessage ? <div className={styles.saveMessage}>{saveMessage}</div> : null}

          {students.length === 0 ? (
            <div className={styles.empty}>No students available.</div>
          ) : (
            <div className={styles.tableResponsive}><table className={styles.table}>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Class</th>
                  <th>Roll #</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {pagedStudents.map((student) => {
                  const status: Status = attendance[student.id] ?? "Present";
                  return (
                    <tr key={student.id}>
                      <td
                        className={styles.rowClickable}
                        onClick={() => setSelectedStudent(student)}
                      >
                        {student.name}
                      </td>
                      <td>{student.classCode}</td>
                      <td>{student.rollNumber || "-"}</td>
                      <td>
                        <button
                          className={
                            status === "Present"
                              ? styles.statusPresent
                              : styles.statusAbsent
                          }
                          type="button"
                          onClick={() => handleToggleAbsent(student.id)}
                        >
                          {status}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table></div>
          )}

          <div className={styles.pagination}>
            <div>
              Page {page} of {totalPages}
            </div>
            <div className={styles.paginationControls}>
              <button
                className={styles.inlineButton}
                type="button"
                onClick={() => setPage(1)}
                disabled={page === 1}
              >
                First
              </button>
              <button
                className={styles.inlineButton}
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1}
              >
                Prev
              </button>
              <button
                className={styles.inlineButton}
                type="button"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
              >
                Next
              </button>
              <button
                className={styles.inlineButton}
                type="button"
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
              >
                Last
              </button>
            </div>
          </div>
        </>
      )}

      {selectedStudent ? (
        <StudentProfileModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      ) : null}

      {showConfirm ? (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <div>
                <h3>Confirm Attendance</h3>
                <p className={styles.modalSubtitle}>
                  Date {attendanceDate}
                </p>
              </div>
            </div>
            <div className={styles.modalBody}>
              Present: {presentCount} · Absent: {absentCount}
            </div>
            <div className={styles.inlineActions}>
              <button
                className={styles.inlineButton}
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                className={styles.button}
                type="button"
                onClick={() => {
                  setShowConfirm(false);
                  handleSave();
                }}
                disabled={isSaving}
              >
                Confirm & Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
