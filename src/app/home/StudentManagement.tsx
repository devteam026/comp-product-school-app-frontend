"use client";

import { useState } from "react";
import styles from "./home.module.css";

const tabs = ["Add Student", "List Students"] as const;

type Student = {
  id: string;
  name: string;
  grade: string;
  section: string;
};

export default function StudentManagement() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Add Student");
  const [students, setStudents] = useState<Student[]>([]);
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("");
  const [section, setSection] = useState("");

  const handleAddStudent = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const newStudent: Student = {
      id: crypto.randomUUID(),
      name: trimmedName,
      grade: grade.trim() || "-",
      section: section.trim() || "-",
    };

    setStudents((prev) => [newStudent, ...prev]);
    setName("");
    setGrade("");
    setSection("");
    setActiveTab("List Students");
  };

  return (
    <div>
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

      {activeTab === "Add Student" ? (
        <form className={styles.form} onSubmit={handleAddStudent}>
          <div className={styles.fieldRow}>
            <label className={styles.label}>
              Student Name
              <input
                className={styles.input}
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </label>

            <label className={styles.label}>
              Grade
              <input
                className={styles.input}
                type="text"
                value={grade}
                onChange={(event) => setGrade(event.target.value)}
              />
            </label>

            <label className={styles.label}>
              Section
              <input
                className={styles.input}
                type="text"
                value={section}
                onChange={(event) => setSection(event.target.value)}
              />
            </label>
          </div>

          <button className={styles.button} type="submit">
            Add Student
          </button>
        </form>
      ) : students.length === 0 ? (
        <div className={styles.empty}>No students yet. Add one to get started.</div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Grade</th>
              <th>Section</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id}>
                <td>{student.name}</td>
                <td>{student.grade}</td>
                <td>{student.section}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
