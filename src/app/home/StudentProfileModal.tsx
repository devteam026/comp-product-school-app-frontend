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
      : student.history.map((entry) => ({ entry }));

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
      if (data?.url) {
        setPhotoUrl(data.url);
      } else {
        setPhotoUrl("");
      }
    }
    setPhotoLoading(false);
  };

  useEffect(() => {
    loadPhoto();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student.id]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setIsUploading(true);
    try {
      const token = window.localStorage.getItem("authToken");
      const uploadRequest = await fetch(
        apiUrl(
          `/api/students/${student.id}/photo-upload?contentType=${encodeURIComponent(
            file.type
          )}&fileName=${encodeURIComponent(file.name)}&sizeBytes=${file.size}`
        ),
        {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }
      );
      if (!uploadRequest.ok) {
        const err = await uploadRequest.json().catch(() => ({}));
        throw new Error(err?.error ?? "Unable to start upload");
      }
      const { uploadUrl, objectKey } = await uploadRequest.json();
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!uploadResponse.ok) {
        throw new Error("Upload failed");
      }

      const updateResponse = await fetch(apiUrl(`/api/students/${student.id}`), {
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
      if (!updateResponse.ok) {
        throw new Error("Failed to save photo reference");
      }
      await loadPhoto();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setUploadError(message);
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
          <button className={styles.inlineButton} type="button" onClick={onClose}>
            Close
          </button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.profileSection}>
            <div className={styles.sectionTitle}>Profile Photo</div>
            <div className={styles.photoCard}>
              <div className={styles.photoFrame}>
                {photoUrl ? (
                  <img
                    className={styles.profilePhoto}
                    src={photoUrl}
                    alt={`${student.name} profile`}
                  />
                ) : photoLoading ? (
                  <div className={styles.photoSkeleton} />
                ) : (
                  <div className={styles.profilePhotoPlaceholder}>No photo</div>
                )}
              </div>
              <div className={styles.photoActions}>
                <label className={styles.uploadButton}>
                  {isUploading ? "Uploading..." : "Upload Photo"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={isUploading}
                    hidden
                  />
                </label>
                {uploadError ? (
                  <div className={styles.error}>{uploadError}</div>
                ) : null}
              </div>
            </div>
          </div>
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
                <span>Register #</span>
                <div className={styles.profileValue}>{student.registerNo || "-"}</div>
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
              {historyEntries.map((item, index) => {
                const timestamp = formatTimestamp(item.createdAt);
                return (
                  <li key={`${item.entry}-${index}`} className={styles.historyItem}>
                    <span>{item.entry}</span>
                    {timestamp ? (
                      <span className={styles.historyMeta}>{timestamp}</span>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
