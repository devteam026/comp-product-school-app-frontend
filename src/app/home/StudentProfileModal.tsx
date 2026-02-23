"use client";

import styles from "../styles/home.module.css";
import type { Student } from "./data";

type StudentProfileModalProps = {
  student: Student;
  onClose: () => void;
};

export default function StudentProfileModal({
  student,
  onClose,
}: StudentProfileModalProps) {
  return (
    <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
      <div className={styles.modalCard}>
        <div className={styles.modalHeader}>
          <div>
            <h3>Student Profile</h3>
            <p className={styles.modalSubtitle}>
              {student.name} · Class {student.classCode}
            </p>
          </div>
          <button className={styles.inlineButton} type="button" onClick={onClose}>
            Close
          </button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.profileSection}>
            <div className={styles.sectionTitle}>Student Details</div>
            <div className={styles.profileGrid}>
              <div className={styles.profileField}>
                <span>Name</span>
                <div className={styles.profileValue}>{student.name}</div>
              </div>
              <div className={styles.profileField}>
                <span>Class</span>
                <div className={styles.profileValue}>{student.classCode}</div>
              </div>
              <div className={styles.profileField}>
                <span>Gender</span>
                <div className={styles.profileValue}>{student.gender}</div>
              </div>
              <div className={styles.profileField}>
                <span>Date of Birth</span>
                <div className={styles.profileValue}>{student.dateOfBirth || "-"}</div>
              </div>
              <div className={styles.profileField}>
                <span>Admission #</span>
                <div className={styles.profileValue}>{student.admissionNumber || "-"}</div>
              </div>
              <div className={styles.profileField}>
                <span>Roll #</span>
                <div className={styles.profileValue}>{student.rollNumber || "-"}</div>
              </div>
              <div className={styles.profileField}>
                <span>Status</span>
                <div className={styles.profileValue}>{student.status}</div>
              </div>
              <div className={styles.profileField}>
                <span>Address</span>
                <div className={styles.profileValue}>{student.address || "-"}</div>
              </div>
            </div>
          </div>

          <div className={styles.profileSection}>
            <div className={styles.sectionTitle}>Parent/Guardian</div>
            <div className={styles.profileGrid}>
              <div className={styles.profileField}>
                <span>Name</span>
                <div className={styles.profileValue}>{student.parentName || "-"}</div>
              </div>
              <div className={styles.profileField}>
                <span>Relation</span>
                <div className={styles.profileValue}>{student.parentRelation || "-"}</div>
              </div>
              <div className={styles.profileField}>
                <span>Phone</span>
                <div className={styles.profileValue}>{student.parentPhone || "-"}</div>
              </div>
              <div className={styles.profileField}>
                <span>Email</span>
                <div className={styles.profileValue}>{student.parentEmail || "-"}</div>
              </div>
              <div className={styles.profileField}>
                <span>Occupation</span>
                <div className={styles.profileValue}>{student.parentOccupation || "-"}</div>
              </div>
            </div>
          </div>

          <div className={styles.profileSection}>
            <div className={styles.sectionTitle}>History</div>
            <ul className={styles.historyList}>
              {student.history.map((entry, index) => (
                <li key={`${entry}-${index}`}>{entry}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
