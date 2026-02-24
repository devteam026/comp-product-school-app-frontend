"use client";

import { useEffect, useState } from "react";
import styles from "../styles/home.module.css";
import { apiUrl } from "../../lib/api";

type AIEngineProps = {
  classCode?: string;
  onStudentClick?: (name: string) => void;
};

export default function AIEngine({ classCode, onStudentClick }: AIEngineProps) {
  const [scoreOp, setScoreOp] = useState<">" | "<" | "=">(">");
  const [scoreValue, setScoreValue] = useState("8");
  const [topStudents, setTopStudents] = useState<
    { name: string; classCode: string; score: number }[]
  >([]);
  const [atRiskStudents, setAtRiskStudents] = useState<
    { name: string; classCode: string; score: number }[]
  >([]);
  const [topTeachers, setTopTeachers] = useState<
    { name: string; subject: string; rating: number; classes: string[] }[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isActive = true;
    const token = window.localStorage.getItem("authToken");
    const params = new URLSearchParams();
    if (classCode) params.set("classCode", classCode);
    if (scoreValue) {
      params.set("scoreOp", scoreOp);
      params.set("scoreValue", scoreValue);
    }
    setIsLoading(true);
    fetch(apiUrl(`/api/insights?${params.toString()}`), {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isActive || !data) return;
        setTopStudents(Array.isArray(data.topStudents) ? data.topStudents : []);
        setAtRiskStudents(
          Array.isArray(data.atRiskStudents) ? data.atRiskStudents : []
        );
        setTopTeachers(Array.isArray(data.topTeachers) ? data.topTeachers : []);
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });
    return () => {
      isActive = false;
    };
  }, [classCode, scoreOp, scoreValue]);

  return (
    <div className={styles.form}>
      <div className={styles.sectionTitle}>AI Suggestions</div>
      <p className={styles.subtitle}>
        Demo view. Rankings change based on the selected class.
      </p>

      <div className={styles.filterRow}>
        <label className={styles.inlineLabel}>
          Score
          <select
            className={styles.inlineSelect}
            value={scoreOp}
            onChange={(event) => setScoreOp(event.target.value as ">" | "<" | "=")}
          >
            <option value=">">&gt;</option>
            <option value="<">&lt;</option>
            <option value="=">=</option>
          </select>
        </label>
        <label className={styles.inlineLabel}>
          Value
          <input
            className={styles.inlineSelect}
            type="number"
            min="1"
            max="10"
            step="0.1"
            value={scoreValue}
            onChange={(event) => setScoreValue(event.target.value)}
          />
        </label>
      </div>

      <div className={styles.listLayout}>
        <div className={styles.profileSection}>
          <div className={styles.sectionTitle}>Top Rated Students (AI)</div>
          {isLoading ? (
            <div className={styles.empty}>Loading insights...</div>
          ) : topStudents.length === 0 ? (
            <div className={styles.empty}>No students for this class.</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Class</th>
                  <th>Score (1-10)</th>
                </tr>
              </thead>
              <tbody>
                {topStudents.map((student) => (
                  <tr key={student.name}>
                    <td
                      className={styles.rowClickable}
                      onClick={() => onStudentClick?.(student.name)}
                    >
                      {student.name}
                    </td>
                    <td>{student.classCode}</td>
                    <td>{student.score.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className={styles.profileSection}>
          <div className={styles.sectionTitle}>Students at Risk</div>
          {isLoading ? (
            <div className={styles.empty}>Loading insights...</div>
          ) : atRiskStudents.length === 0 ? (
            <div className={styles.empty}>No at-risk students right now.</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Class</th>
                  <th>Score (1-10)</th>
                </tr>
              </thead>
              <tbody>
                {atRiskStudents.map((student) => (
                  <tr key={student.name}>
                    <td
                      className={styles.rowClickable}
                      onClick={() => onStudentClick?.(student.name)}
                    >
                      {student.name}
                    </td>
                    <td>{student.classCode}</td>
                    <td>{student.score.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className={styles.profileSection}>
          <div className={styles.sectionTitle}>Top Rated Teachers (Students)</div>
          {isLoading ? (
            <div className={styles.empty}>Loading insights...</div>
          ) : topTeachers.length === 0 ? (
            <div className={styles.empty}>No teachers for this class.</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Subject</th>
                  <th>Rating (1-10)</th>
                </tr>
              </thead>
              <tbody>
                {topTeachers.map((teacher) => (
                  <tr key={teacher.name}>
                    <td>{teacher.name}</td>
                    <td>{teacher.subject}</td>
                    <td>{teacher.rating.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
