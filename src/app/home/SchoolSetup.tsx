"use client";

import { useEffect, useState } from "react";
import styles from "../styles/home.module.css";
import { apiUrl } from "../../lib/api";

type Subject = { id: number; name: string; color?: string; classCode?: string };
type ClassManage = { id: number; name: string; section: string; classCode: string; maxStrength?: number };

type SchoolSetupProps = {
  onClassChange?: () => void;
  activeClassCode?: string;
};

type ConfirmDialog = {
  title: string;
  lines: string[];
  onConfirm: () => void;
} | null;

export default function SchoolSetup({ onClassChange, activeClassCode }: SchoolSetupProps) {
  const [activeTab, setActiveTab] = useState<"School Profile" | "Classes" | "Subjects" | "Holidays">("School Profile");
  const [message, setMessage] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog>(null);

  // School Profile state
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [schoolName, setSchoolName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [schoolUrl, setSchoolUrl] = useState("");
  const [about, setAbout] = useState("");
  const [mission, setMission] = useState("");
  const [vision, setVision] = useState("");
  const [brandName, setBrandName] = useState("");
  const [sidebarBg, setSidebarBg] = useState("#1e293b");
  const [logoUrl, setLogoUrl] = useState("");
  const [campusImageUrl, setCampusImageUrl] = useState("");
  const [appTitle, setAppTitle] = useState("");
  const [appDescription, setAppDescription] = useState("");

  // Class state
  const [classes, setClasses] = useState<ClassManage[]>([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [className, setClassName] = useState("");
  const [classSection, setClassSection] = useState("");
  const [classMaxStrength, setClassMaxStrength] = useState("");
  const [editingClassId, setEditingClassId] = useState<number | null>(null);

  // Holiday state
  type Holiday = { id: number; date: string; name: string };
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [holidaysLoading, setHolidaysLoading] = useState(false);
  const [holidayDate, setHolidayDate] = useState("");
  const [holidayName, setHolidayName] = useState("");
  const [holidaySaving, setHolidaySaving] = useState(false);

  // Subject state
  const [setupClassId, setSetupClassId] = useState(""); // form dropdown only
  const [tableClassId, setTableClassId] = useState(""); // drives the subjects table
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [subjectName, setSubjectName] = useState("");
  const [subjectColor, setSubjectColor] = useState("#64748b");
  const [editingSubjectId, setEditingSubjectId] = useState<number | null>(null);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(null), 3000);
    return () => window.clearTimeout(timer);
  }, [message]);

  // Load school profile on mount
  useEffect(() => {
    let isActive = true;
    setProfileLoading(true);
    fetch(apiUrl("/api/school"))
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isActive || !data) return;
        setSchoolName(data.schoolName ?? "");
        setPhone(data.phone ?? "");
        setAddress(data.address ?? "");
        setSchoolUrl(data.schoolUrl ?? "");
        setAbout(data.about ?? "");
        setMission(data.mission ?? "");
        setVision(data.vision ?? "");
        setBrandName(data.brandName ?? "");
        setSidebarBg(data.sidebarBg ?? "#1e293b");
        setLogoUrl(data.logoUrl ?? "");
        setCampusImageUrl(data.campusImageUrl ?? "");
        setAppTitle(data.appTitle ?? "");
        setAppDescription(data.appDescription ?? "");
      })
      .finally(() => { if (isActive) setProfileLoading(false); });
    return () => { isActive = false; };
  }, []);

  const handleSaveProfile = async () => {
    if (!schoolName.trim()) {
      setMessage("School name is required.");
      return;
    }
    setProfileSaving(true);
    const token = window.localStorage.getItem("authToken");
    const response = await fetch(apiUrl("/api/school"), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        schoolName: schoolName.trim(),
        phone: phone.trim() || null,
        address: address.trim() || null,
        schoolUrl: schoolUrl.trim() || null,
        about: about.trim() || null,
        mission: mission.trim() || null,
        vision: vision.trim() || null,
        brandName: brandName.trim() || null,
        sidebarBg: sidebarBg || null,
        logoUrl: logoUrl.trim() || null,
        campusImageUrl: campusImageUrl.trim() || null,
        appTitle: appTitle.trim() || null,
        appDescription: appDescription.trim() || null,
      }),
    });
    if (response.ok) {
      setMessage("School profile saved successfully.");
    } else {
      const err = await response.json().catch(() => ({}));
      setMessage(err?.message ?? err?.error ?? "Unable to save profile.");
    }
    setProfileSaving(false);
  };

  const loadClasses = async () => {
    setClassesLoading(true);
    const token = window.localStorage.getItem("authToken");
    const response = await fetch(apiUrl("/api/classes/manage"), {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (response.ok) {
      setClasses(await response.json());
    }
    setClassesLoading(false);
  };

  const loadHolidays = async () => {
    setHolidaysLoading(true);
    const token = window.localStorage.getItem("authToken");
    const response = await fetch(apiUrl("/api/holidays"), {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (response.ok) {
      setHolidays(await response.json());
    }
    setHolidaysLoading(false);
  };

  const handleAddHoliday = async () => {
    if (!holidayDate) {
      setMessage("Date is required.");
      return;
    }
    if (!holidayName.trim()) {
      setMessage("Holiday name is required.");
      return;
    }
    setHolidaySaving(true);
    const token = window.localStorage.getItem("authToken");
    const response = await fetch(apiUrl("/api/holidays"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ date: holidayDate, name: holidayName.trim() }),
    });
    if (response.ok) {
      setHolidayDate("");
      setHolidayName("");
      setMessage("Holiday added.");
      loadHolidays();
    } else {
      const err = await response.json().catch(() => ({}));
      setMessage(err?.message ?? err?.error ?? "Unable to add holiday.");
    }
    setHolidaySaving(false);
  };

  const handleDeleteHoliday = (h: Holiday) => {
    setConfirmDialog({
      title: `Remove holiday "${h.name}" on ${h.date}?`,
      lines: ["This will remove the holiday declaration. Attendance can be taken on this date again."],
      onConfirm: async () => {
        setConfirmDialog(null);
        const token = window.localStorage.getItem("authToken");
        const response = await fetch(apiUrl(`/api/holidays/${h.id}`), {
          method: "DELETE",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (response.ok) {
          setMessage("Holiday removed.");
          loadHolidays();
        } else {
          setMessage("Unable to remove holiday.");
        }
      },
    });
  };

  const loadSubjects = async (classId: string) => {
    setSubjectsLoading(true);
    const token = window.localStorage.getItem("authToken");
    const param = classId ? `?classId=${classId}` : "";
    const response = await fetch(apiUrl(`/api/timetable/subjects${param}`), {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (response.ok) {
      setSubjects(await response.json());
    }
    setSubjectsLoading(false);
  };

  useEffect(() => {
    loadClasses();
  }, []);

  // Sync subjects table with top class filter only (form dropdown is independent)
  useEffect(() => {
    if (classes.length === 0) return;
    if (!activeClassCode || activeClassCode === "all") {
      setTableClassId("");
      return;
    }
    const match = classes.find((c) => c.classCode === activeClassCode);
    setTableClassId(match ? String(match.id) : "");
  }, [activeClassCode, classes]);

  // Table reloads only when activeClassCode changes (via tableClassId), not when form dropdown changes
  useEffect(() => {
    if (activeTab === "Subjects") {
      loadSubjects(tableClassId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, tableClassId]);

  useEffect(() => {
    if (activeTab === "Holidays") {
      loadHolidays();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleSaveClass = async () => {
    if (!className.trim()) {
      setMessage("Class name is required.");
      return;
    }
    if (!classSection.trim()) {
      setMessage("Section is required.");
      return;
    }
    const computedClassCode = `${className.trim()}${classSection.trim()}`;
    const token = window.localStorage.getItem("authToken");
    const response = await fetch(
      apiUrl(editingClassId ? `/api/classes/manage/${editingClassId}` : "/api/classes/manage"),
      {
        method: editingClassId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          classCode: computedClassCode,
          name: className.trim(),
          section: classSection.trim(),
          maxStrength: classMaxStrength ? Number(classMaxStrength) : null,
        }),
      }
    );
    if (response.ok) {
      setMessage(editingClassId ? "Class updated." : "Class saved.");
      setClassName("");
      setClassSection("");
      setClassMaxStrength("");
      setEditingClassId(null);
      loadClasses();
      onClassChange?.();
    } else {
      const err = await response.json().catch(() => ({}));
      setMessage(err?.message ?? err?.error ?? "Unable to save class.");
    }
  };

  const handleDeleteClass = (c: ClassManage) => {
    setConfirmDialog({
      title: `Delete class "${c.classCode}"?`,
      lines: [
        "This action is permanent and cannot be undone.",
        "It will also remove:",
        "• All timetable periods for this class",
        "• All subjects assigned to this class",
        "• All attendance records linked to this class",
        "• Any student or fee data referencing this class",
      ],
      onConfirm: async () => {
        setConfirmDialog(null);
        const token = window.localStorage.getItem("authToken");
        const response = await fetch(apiUrl(`/api/classes/manage/${c.id}`), {
          method: "DELETE",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (response.ok) {
          setMessage("Class deleted.");
          loadClasses();
          onClassChange?.();
        } else {
          setMessage("Unable to delete class.");
        }
      },
    });
  };

  const handleSaveSubject = async () => {
    if (!setupClassId || !subjectName.trim()) {
      setMessage("Select a class and enter subject name.");
      return;
    }
    const token = window.localStorage.getItem("authToken");
    const response = await fetch(
      apiUrl(editingSubjectId ? `/api/timetable/subjects/${editingSubjectId}` : "/api/timetable/subjects"),
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
      loadSubjects(tableClassId);
    } else {
      const err = await response.json().catch(() => ({}));
      setMessage(err?.message ?? err?.error ?? "Unable to save subject.");
    }
  };

  const handleDeleteSubject = (subject: Subject) => {
    setConfirmDialog({
      title: `Delete subject "${subject.name}"?`,
      lines: [
        "This will permanently remove this subject and all timetable slots assigned to it.",
        "This cannot be undone.",
      ],
      onConfirm: async () => {
        setConfirmDialog(null);
        const token = window.localStorage.getItem("authToken");
        const response = await fetch(apiUrl(`/api/timetable/subjects/${subject.id}`), {
          method: "DELETE",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (response.ok) {
          setMessage("Subject deleted.");
          loadSubjects(tableClassId);
        } else {
          setMessage("Unable to delete subject.");
        }
      },
    });
  };

  return (
    <div className={styles.form}>
      <div className={styles.tabs}>
        {(["School Profile", "Classes", "Subjects", "Holidays"] as const).map((tab) => (
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

      {message ? <div className={styles.success}>{message}</div> : null}

      {activeTab === "School Profile" ? (
        profileLoading ? (
          <div className={styles.loadingCard}>
            <div className={styles.skeletonTitle} />
            <div className={styles.skeletonLine} />
            <div className={styles.skeletonLine} />
          </div>
        ) : (
          <div>
            <div className={styles.profileSection}>
              <div className={styles.sectionTitle}>Basic Information</div>
              <div className={styles.fieldGrid}>
                <label className={styles.label}>
                  School Name <span className={styles.requiredMark}>*</span>
                  <input className={styles.input} value={schoolName} onChange={(e) => setSchoolName(e.target.value)} />
                </label>
                <label className={styles.label}>
                  Phone
                  <input className={styles.input} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 99999 99999" />
                </label>
                <label className={styles.label}>
                  School Website URL
                  <input className={styles.input} type="url" value={schoolUrl} onChange={(e) => setSchoolUrl(e.target.value)} placeholder="https://yourschool.edu" />
                </label>
              </div>
              <label className={styles.label}>
                Address
                <textarea className={styles.input} value={address} onChange={(e) => setAddress(e.target.value)} rows={2} placeholder="Full address of the school" />
              </label>
            </div>

            <div className={styles.profileSection}>
              <div className={styles.sectionTitle}>About the School</div>
              <div className={styles.fieldGrid}>
                <label className={styles.label}>
                  About
                  <textarea className={styles.input} value={about} onChange={(e) => setAbout(e.target.value)} rows={3} placeholder="Brief description of the school" />
                </label>
                <label className={styles.label}>
                  Mission
                  <textarea className={styles.input} value={mission} onChange={(e) => setMission(e.target.value)} rows={3} placeholder="School mission statement" />
                </label>
                <label className={styles.label}>
                  Vision
                  <textarea className={styles.input} value={vision} onChange={(e) => setVision(e.target.value)} rows={3} placeholder="School vision statement" />
                </label>
              </div>
            </div>

            <div className={styles.profileSection}>
              <div className={styles.sectionTitle}>Branding & Appearance</div>
              <div className={styles.fieldGrid}>
                <label className={styles.label}>
                  Brand Name
                  <input className={styles.input} value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="Name shown in sidebar header" />
                </label>
                <label className={styles.label}>
                  Sidebar Background Color
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <input className={styles.input} type="color" value={sidebarBg} onChange={(e) => setSidebarBg(e.target.value)} style={{ width: "60px", padding: "2px 4px" }} />
                    <input className={styles.input} value={sidebarBg} onChange={(e) => setSidebarBg(e.target.value)} placeholder="#1e293b" />
                  </div>
                </label>
                <label className={styles.label}>
                  Logo URL
                  <input className={styles.input} type="url" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://... (image URL)" />
                </label>
                <label className={styles.label}>
                  Campus Image URL
                  <input className={styles.input} type="url" value={campusImageUrl} onChange={(e) => setCampusImageUrl(e.target.value)} placeholder="https://... (shown on login page background)" />
                </label>
              </div>
            </div>

            <div className={styles.profileSection}>
              <div className={styles.sectionTitle}>SEO & App Settings</div>
              <div className={styles.fieldGrid}>
                <label className={styles.label}>
                  Browser Tab Title
                  <input className={styles.input} value={appTitle} onChange={(e) => setAppTitle(e.target.value)} placeholder="e.g. My School Portal" />
                </label>
                <label className={styles.label}>
                  Meta Description
                  <input className={styles.input} value={appDescription} onChange={(e) => setAppDescription(e.target.value)} placeholder="Short description for search engines" />
                </label>
              </div>
            </div>

            <div className={styles.formActions}>
              <button className={styles.button} type="button" onClick={handleSaveProfile} disabled={profileSaving}>
                {profileSaving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </div>
        )
      ) : activeTab === "Classes" ? (
        <div className={styles.profileSection}>
          <div className={styles.sectionTitle}>Class Details</div>
          <div className={styles.fieldGrid}>
            <label className={styles.label}>
              Class Name <span className={styles.requiredMark}>*</span>
              <input
                className={styles.input}
                value={className}
                onChange={(e) => setClassName(e.target.value)}
              />
            </label>
            <label className={styles.label}>
              Section <span className={styles.requiredMark}>*</span>
              <input
                className={styles.input}
                value={classSection}
                onChange={(e) => setClassSection(e.target.value)}
              />
            </label>
            <label className={styles.label}>
              Class Code
              <input
                className={styles.input}
                value={`${className.trim()}${classSection.trim()}`}
                readOnly
                style={{ opacity: 0.7 }}
              />
            </label>
            <label className={styles.label}>
              Max Strength
              <input
                className={styles.input}
                type="number"
                min={1}
                value={classMaxStrength}
                onChange={(e) => setClassMaxStrength(e.target.value)}
                placeholder="e.g. 40"
              />
            </label>
          </div>
          <div className={styles.formActions}>
            <button className={styles.button} type="button" onClick={handleSaveClass}>
              {editingClassId ? "Update Class" : "Save Class"}
            </button>
            {editingClassId ? (
              <button
                className={styles.inlineButton}
                type="button"
                onClick={() => {
                  setEditingClassId(null);
                  setClassName("");
                  setClassSection("");
                  setClassMaxStrength("");
                }}
              >
                Cancel
              </button>
            ) : null}
          </div>
          <div className={styles.tableResponsive}>
            {classesLoading ? (
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
                  <th>Class Code</th>
                  <th>Name</th>
                  <th>Section</th>
                  <th>Max Strength</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {classes.map((c, index) => (
                  <tr key={c.id}>
                    <td>{index + 1}</td>
                    <td>{c.classCode}</td>
                    <td>{c.name}</td>
                    <td>{c.section ?? "-"}</td>
                    <td>{c.maxStrength ?? "-"}</td>
                    <td>
                      <button
                        className={styles.inlineButton}
                        type="button"
                        onClick={() => {
                          setEditingClassId(c.id);
                          setClassName(c.name);
                          setClassSection(c.section ?? "");
                          setClassMaxStrength(c.maxStrength != null ? String(c.maxStrength) : "");
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className={styles.inlineButton}
                        type="button"
                        onClick={() => handleDeleteClass(c)}
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
      ) : activeTab === "Holidays" ? (
        <div className={styles.profileSection}>
          <div className={styles.sectionTitle}>Declare Holiday</div>
          <div className={styles.fieldGrid}>
            <label className={styles.label}>
              Date <span className={styles.requiredMark}>*</span>
              <input
                className={styles.input}
                type="date"
                value={holidayDate}
                onChange={(e) => setHolidayDate(e.target.value)}
              />
            </label>
            <label className={styles.label}>
              Holiday Name <span className={styles.requiredMark}>*</span>
              <input
                className={styles.input}
                value={holidayName}
                onChange={(e) => setHolidayName(e.target.value)}
                placeholder="e.g. Diwali, Republic Day"
              />
            </label>
          </div>
          <div className={styles.formActions}>
            <button className={styles.button} type="button" onClick={handleAddHoliday} disabled={holidaySaving}>
              {holidaySaving ? "Adding..." : "Add Holiday"}
            </button>
          </div>
          <div className={styles.tableResponsive}>
            {holidaysLoading ? (
              <div className={styles.loadingCard}>
                <div className={styles.skeletonTitle} />
                <div className={styles.skeletonLine} />
                <div className={styles.skeletonLine} />
              </div>
            ) : holidays.length === 0 ? (
              <div className={styles.empty}>No holidays declared yet.</div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Date</th>
                    <th>Name</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {holidays.map((h, index) => (
                    <tr key={h.id}>
                      <td>{index + 1}</td>
                      <td>{h.date}</td>
                      <td>{h.name}</td>
                      <td>
                        <button
                          className={styles.inlineButton}
                          type="button"
                          onClick={() => handleDeleteHoliday(h)}
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
      ) : (
        <div className={styles.profileSection}>
          <div className={styles.sectionTitle}>Class Subjects</div>
          <div className={styles.fieldGrid}>
            <label className={styles.label}>
              Class <span className={styles.requiredMark}>*</span>
              <select
                className={styles.input}
                value={setupClassId}
                onChange={(e) => setSetupClassId(e.target.value)}
              >
                <option value="">Select</option>
                {classes.map((c) => (
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
            <button className={styles.button} type="button" onClick={handleSaveSubject}>
              {editingSubjectId ? "Update Subject" : "Save Subject"}
            </button>
            {editingSubjectId ? (
              <button
                className={styles.inlineButton}
                type="button"
                onClick={() => {
                  setEditingSubjectId(null);
                  setSubjectName("");
                  setSubjectColor("#64748b");
                }}
              >
                Cancel
              </button>
            ) : null}
          </div>
          <div className={styles.tableResponsive}>
            {subjectsLoading ? (
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
                  <th>Name</th>
                  <th>Color</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((subject, index) => (
                  <tr key={subject.id}>
                    <td>{index + 1}</td>
                    <td>{subject.classCode ?? "-"}</td>
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
                        onClick={() => handleDeleteSubject(subject)}
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
      )}
      {confirmDialog ? (
        <div className={styles.modalBackdrop} onClick={() => setConfirmDialog(null)}>
          <div
            className={styles.modalCard}
            style={{ maxWidth: 480, padding: "28px 32px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "16px" }}>
              <span style={{ fontSize: "22px", lineHeight: 1 }}>⚠️</span>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "#0f172a" }}>
                {confirmDialog.title}
              </h3>
            </div>
            <div style={{ fontSize: "14px", color: "#475569", display: "grid", gap: "6px", marginBottom: "24px" }}>
              {confirmDialog.lines.map((line, i) => (
                <p key={i} style={{ margin: 0, paddingLeft: line.startsWith("•") ? "8px" : 0 }}>
                  {line}
                </p>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                className={styles.inlineButton}
                type="button"
                onClick={() => setConfirmDialog(null)}
                style={{ padding: "8px 20px" }}
              >
                Cancel
              </button>
              <button
                className={styles.button}
                type="button"
                onClick={confirmDialog.onConfirm}
                style={{ background: "#dc2626", padding: "8px 20px" }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
