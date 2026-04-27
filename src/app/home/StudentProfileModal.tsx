"use client";

import { useEffect, useState } from "react";
import styles from "../styles/home.module.css";
import type { Student } from "./data";
import { apiUrl } from "../../lib/api";

type StudentProfileModalProps = {
  student: Student;
  onClose: () => void;
};

export default function StudentProfileModal({
  student,
  onClose,
}: StudentProfileModalProps) {
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [photoLoading, setPhotoLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const historyEntries =
    student.historyEntries && student.historyEntries.length > 0
      ? student.historyEntries
      : student.history.map((entry) => ({ entry, createdAt: undefined }));

  const formatTimestamp = (value?: string | null) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleString();
  };

  const loadPhoto = async () => {
    setPhotoLoading(true);
    const token = window.localStorage.getItem("authToken");
    const response = await fetch(apiUrl(`/api/students/${student.id}/photo-url`), {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (response.ok) {
      const data = await response.json().catch(() => null);
      setPhotoUrl(data?.url || "");
    }
    setPhotoLoading(false);
  };

  useEffect(() => {
    loadPhoto();
  }, [student.id]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setIsUploading(true);
    try {
      const token = window.localStorage.getItem("authToken");
      const uploadRequest = await fetch(
        apiUrl(`/api/students/${student.id}/photo-upload`),
        {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }
      );
      const { uploadUrl, objectKey } = await uploadRequest.json();

      await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      await fetch(apiUrl(`/api/students/${student.id}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          ...student,
          profilePhotoKey: objectKey,
        }),
      });

      await loadPhoto();
    } catch (err) {
      setUploadError("Upload failed");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

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
          <button className={styles.inlineButton} onClick={onClose}>
            Close
          </button>
        </div>

        <div className={styles.modalBody}>
          {/* PHOTO */}
          <div className={styles.profileSection}>
            <div className={styles.sectionTitle}>Profile Photo</div>
            <div className={styles.photoCard}>
              <div className={styles.photoFrame}>
                {photoUrl ? (
                  <img className={styles.profilePhoto} src={photoUrl} />
                ) : photoLoading ? (
                  <div className={styles.photoSkeleton} />
                ) : (
                  <div>No photo</div>
                )}
              </div>
              <label className={styles.uploadButton}>
                {isUploading ? "Uploading..." : "Upload"}
                <input type="file" hidden onChange={handleFileChange} />
              </label>
              {uploadError && <div className={styles.error}>{uploadError}</div>}
            </div>
          </div>

          {/* BASIC */}
          <div className={styles.profileSection}>
            <div className={styles.sectionTitle}>Basic Details</div>
            <div className={styles.profileGrid}>
              <Field label="Name" value={student.name} />
              <Field label="Class" value={student.classCode} />
              <Field label="Gender" value={student.gender} />
              <Field label="DOB" value={student.dateOfBirth} />
              <Field label="Admission #" value={student.admissionNumber} />
              <Field label="Register #" value={student.registerNo} />
              <Field label="Roll #" value={student.rollNumber} />
              <Field label="Status" value={student.status} />
              <Field label="Session" value={student.session} />
              <Field label="Address" value={student.address} />
            </div>
          </div>

          {/* PARENTS */}
          <div className={styles.profileSection}>
            <div className={styles.sectionTitle}>Parent / Guardian</div>
            <div className={styles.profileGrid}>
              <Field label="Father" value={student.fatherName} />
              <Field label="Mother" value={student.motherName} />
              <Field label="Guardian" value={student.parentName} />
              <Field label="Relation" value={student.parentRelation} />
              <Field label="Phone" value={student.parentPhone} />
              <Field label="WhatsApp" value={student.parentWhatsapp} />
              <Field label="Email" value={student.parentEmail} />
              <Field label="Occupation" value={student.parentOccupation} />
            </div>
          </div>

          {/* TRANSPORT */}
          <div className={styles.profileSection}>
            <div className={styles.sectionTitle}>Transport</div>
            <div className={styles.profileGrid}>
              <Field
                label="Required"
                value={student.transportRequired ? "Yes" : "No"}
              />
              {student.transportRequired && (
                <>
                  <Field label="Route" value={student.transportRoute} />
                  <Field label="Vehicle" value={student.transportVehicleNo} />
                  <Field label="Stop" value={student.transportStopName} />
                </>
              )}
            </div>
          </div>

          {/* HOSTEL */}
          <div className={styles.profileSection}>
            <div className={styles.sectionTitle}>Hostel</div>
            <div className={styles.profileGrid}>
              <Field
                label="Required"
                value={student.hostelRequired ? "Yes" : "No"}
              />
              {student.hostelRequired && (
                <>
                  <Field label="Hostel" value={student.hostelName} />
                  <Field label="Room" value={student.hostelRoomNo} />
                </>
              )}
            </div>
          </div>

          {/* PREVIOUS SCHOOL */}
          <div className={styles.profileSection}>
            <div className={styles.sectionTitle}>Previous School</div>
            <div className={styles.profileGrid}>
              <Field label="School" value={student.previousSchoolName} />
              <Field label="Qualification" value={student.previousQualification} />
            </div>
          </div>

          {/* HISTORY */}
          <div className={styles.profileSection}>
            <div className={styles.sectionTitle}>History</div>
            <ul className={styles.historyList}>
              {historyEntries.map((item, index) => (
                <li key={index}>
                  {item.entry}{" "}
                  {formatTimestamp(item.createdAt) && (
                    <span>({formatTimestamp(item.createdAt)})</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Reusable field */
function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div className={styles.profileField}>
      <span>{label}</span>
      <div className={styles.profileValue}>{value || "-"}</div>
    </div>
  );
}