"use client";

import { useState } from "react";
import styles from "../styles/home.module.css";
import type { Student } from "./data";

type AttendanceManagementProps = {
  students: Student[];
};

export default function AttendanceManagement({ students }: AttendanceManagementProps) {
  const [attendanceDate, setAttendanceDate] = useState(
    () => new Date().toISOString().slice(0, 10)
  );
  const [attendanceStatus, setAttendanceStatus] = useState("Present");

  return (
    <div className={styles.form}>
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
        <label className={styles.label}>
          Status
          <select
            className={styles.input}
            value={attendanceStatus}
            onChange={(event) => setAttendanceStatus(event.target.value)}
          >
            <option>Present</option>
            <option>Absent</option>
            <option>Late</option>
            <option>Excused</option>
          </select>
        </label>
      </div>

      {students.length === 0 ? (
        <div className={styles.empty}>No students available.</div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Student</th>
              <th>Grade</th>
              <th>Section</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id}>
                <td>{student.name}</td>
                <td>{student.grade}</td>
                <td>{student.section}</td>
                <td>{attendanceStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
