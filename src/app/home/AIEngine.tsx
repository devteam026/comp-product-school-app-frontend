"use client";

import { useState } from "react";
import styles from "../styles/home.module.css";

type AIEngineProps = {
  classCode?: string;
  onStudentClick?: (name: string) => void;
};

const topStudents = [
  { name: "Ava Wilson", classCode: "5A", score: 9.8 },
  { name: "Noah Smith", classCode: "6B", score: 9.4 },
  { name: "Mia Patel", classCode: "7A", score: 9.6 },
  { name: "Liam Carter", classCode: "8C", score: 9.2 },
  { name: "Sophia Kim", classCode: "9B", score: 9.5 },
];

const topTeachers = [
  { name: "Mr. Adams", subject: "Mathematics", rating: 9.2, classes: ["5A"] },
  { name: "Ms. Rivera", subject: "Science", rating: 9.0, classes: ["6B"] },
  { name: "Mrs. Lee", subject: "English", rating: 8.8, classes: ["7A"] },
  { name: "Mr. Singh", subject: "History", rating: 8.7, classes: ["8C", "9B"] },
];

export default function AIEngine({ classCode, onStudentClick }: AIEngineProps) {
  const [scoreOp, setScoreOp] = useState<">" | "<" | "=">(">");
  const [scoreValue, setScoreValue] = useState("8");

  const filteredStudents = classCode
    ? topStudents.filter((student) => student.classCode === classCode)
    : topStudents;

  const scoreNumber = Number(scoreValue);
  const filteredByScore = filteredStudents.filter((student) => {
    if (Number.isNaN(scoreNumber)) return true;
    if (scoreOp === ">") return student.score > scoreNumber;
    if (scoreOp === "<") return student.score < scoreNumber;
    return student.score === scoreNumber;
  });

  const filteredTeachers = classCode
    ? topTeachers.filter((teacher) => teacher.classes.includes(classCode))
    : topTeachers;

  const atRiskStudents = filteredStudents.filter((student) => student.score < 8.0);

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
          {filteredByScore.length === 0 ? (
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
                {filteredByScore.map((student) => (
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
          {atRiskStudents.length === 0 ? (
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
          {filteredTeachers.length === 0 ? (
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
                {filteredTeachers.map((teacher) => (
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
