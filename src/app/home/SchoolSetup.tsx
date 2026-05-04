"use client";

import React, { useEffect, useState } from "react";
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
  const [activeTab, setActiveTab] = useState<"School Profile" | "Classes" | "Subjects" | "Holidays" | "Departments" | "System Roles">("School Profile");
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

  // System Roles state
  const [systemRoles, setSystemRoles] = useState<{ id: number; name: string }[]>([]);
  const [systemRolesLoading, setSystemRolesLoading] = useState(false);
  const [newRoleInput, setNewRoleInput] = useState("");
  const [systemRoleSaving, setSystemRoleSaving] = useState(false);

  // Dept-Designation mapping state
  const ALL_DESIGNATION_OPTIONS = ["Teacher", "Accountant", "Clerk", "Driver", "Warden", "Caretaker", "Security", "Mess Staff", "Admin"];
  const [deptDesignations, setDeptDesignations] = useState<Record<string, string[]>>({});
  const [deptSaving, setDeptSaving] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [expandedDept, setExpandedDept] = useState<string | null>(null);
  const [newRoleName, setNewRoleName] = useState("");

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
      setMessage("Please select a date for the holiday.");
      return;
    }
    const parsedDate = new Date(holidayDate);
    if (isNaN(parsedDate.getTime()) || !/^\d{4}-\d{2}-\d{2}$/.test(holidayDate)) {
      setMessage("Invalid date format. Please select a valid date (YYYY-MM-DD).");
      return;
    }
    if (!holidayName.trim()) {
      setMessage("Holiday name is required.");
      return;
    }
    const duplicate = holidays.find((h) => h.date === holidayDate);
    if (duplicate) {
      setMessage(`A holiday "${duplicate.name}" is already declared on this date.`);
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

  useEffect(() => {
    if (activeTab !== "Departments") return;
    const token = window.localStorage.getItem("authToken");
    fetch(apiUrl("/api/school/dept-designations"), {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
      .then((res) => (res.ok ? res.json() : {}))
      .then((data: Record<string, string[]>) => setDeptDesignations(data));
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "System Roles") return;
    setSystemRolesLoading(true);
    const token = window.localStorage.getItem("authToken");
    fetch(apiUrl("/api/system-roles"), {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setSystemRoles(data))
      .finally(() => setSystemRolesLoading(false));
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
    if (!classMaxStrength.trim()) {
      setMessage("Max Strength is required.");
      return;
    }
    const maxStrengthNum = Number(classMaxStrength);
    if (!Number.isInteger(maxStrengthNum) || maxStrengthNum < 1) {
      setMessage("Max Strength must be a positive whole number (e.g. 40).");
      return;
    }
    const computedClassCode = `${className.trim()}${classSection.trim()}`;
    const duplicate = classes.find(
      (c) => c.classCode === computedClassCode && c.id !== editingClassId
    );
    if (duplicate) {
      setMessage(`Class "${computedClassCode}" already exists. Please use a different name or section.`);
      return;
    }
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
    if (!editingSubjectId) {
      const token = window.localStorage.getItem("authToken");
      const checkRes = await fetch(apiUrl(`/api/timetable/subjects?classId=${setupClassId}`), {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (checkRes.ok) {
        const existing: Subject[] = await checkRes.json();
        const dup = existing.find(
          (s) => s.name.trim().toLowerCase() === subjectName.trim().toLowerCase()
        );
        if (dup) {
          setMessage(`Subject "${subjectName.trim()}" already exists for this class.`);
          return;
        }
      }
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

  const saveDeptMap = async (map: Record<string, string[]>) => {
    setDeptSaving(true);
    const token = window.localStorage.getItem("authToken");
    await fetch(apiUrl("/api/school/dept-designations"), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(map),
    });
    setDeptSaving(false);
  };

  return (
    <div className={styles.form}>
      <div className={styles.tabs}>
        {(["School Profile", "Classes", "Subjects", "Holidays", "Departments", "System Roles"] as const).map((tab) => (
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
              Max Strength <span className={styles.requiredMark}>*</span>
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
      ) : activeTab === "Subjects" ? (
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
      ) : activeTab === "Departments" ? (
        <div className={styles.profileSection}>
          <div className={styles.sectionTitle}>Departments</div>

 

          {/* Add Department */}
          <div className={styles.fieldGrid}>
            <label className={styles.label}>
              Department Name <span className={styles.requiredMark}>*</span>
              <input
                className={styles.input}
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
                placeholder="e.g. Science Lab, IT"
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.form?.requestSubmit?.();
                }}
              />
            </label>
          </div>
          <div className={styles.formActions}>
            <button
              className={styles.button}
              type="button"
              disabled={deptSaving}
              onClick={async () => {
                const name = newDeptName.trim();
                if (!name) { setMessage("Department name is required."); return; }
                if (deptDesignations[name] !== undefined) { setMessage("Department already exists."); return; }
                const updated = { ...deptDesignations, [name]: [] };
                setDeptDesignations(updated);
                setNewDeptName("");
                setExpandedDept(name);
                setNewRoleName("");
                await saveDeptMap(updated);
                setMessage("Department added.");
              }}
            >
              {deptSaving ? "Saving..." : "Add Department"}
            </button>
          </div>

          {/* Department list */}
          {Object.keys(deptDesignations).length === 0 ? (
            <div className={styles.empty}>No departments configured yet. Add one above.</div>
          ) : (
            <div className={styles.tableResponsive} style={{ marginTop: 16 }}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>Designations</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(deptDesignations).map(([dept, roles]) => (
                    <React.Fragment key={dept}>
                      <tr>
                        <td style={{ fontWeight: 600, verticalAlign: "top", paddingTop: 12 }}>{dept}</td>
                        <td>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {roles.length === 0 ? (
                              <span style={{ color: "#94a3b8", fontSize: 13 }}>No roles yet</span>
                            ) : roles.map((role) => (
                              <span key={role} className={styles.roleTag}>
                                {role}
                                <button
                                  className={styles.roleTagRemove}
                                  type="button"
                                  title={`Remove ${role}`}
                                  onClick={async () => {
                                    const updated = {
                                      ...deptDesignations,
                                      [dept]: roles.filter((r) => r !== role),
                                    };
                                    setDeptDesignations(updated);
                                    await saveDeptMap(updated);
                                  }}
                                >×</button>
                              </span>
                            ))}
                          </div>
                        </td>
                        <td style={{ whiteSpace: "nowrap" }}>
                          <button
                            className={styles.inlineButton}
                            type="button"
                            onClick={() => {
                              setExpandedDept(expandedDept === dept ? null : dept);
                              setNewRoleName("");
                            }}
                          >
                            {expandedDept === dept ? "Close" : "Add Role"}
                          </button>
                          <button
                            className={styles.inlineButtonDelete}
                            type="button"
                            onClick={async () => {
                              if (!window.confirm(`Delete department "${dept}" and all its roles?`)) return;
                              const updated = { ...deptDesignations };
                              delete updated[dept];
                              setDeptDesignations(updated);
                              if (expandedDept === dept) setExpandedDept(null);
                              await saveDeptMap(updated);
                              setMessage(`Department "${dept}" deleted.`);
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>

                      {/* Expanded: Add Role row */}
                      {expandedDept === dept ? (
                        <tr key={`${dept}-add-role`}>
                          <td />
                          <td colSpan={2}>
                            <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "8px 0" }}>
                              <select
                                className={styles.input}
                                style={{ maxWidth: 220 }}
                                value={newRoleName}
                                onChange={(e) => setNewRoleName(e.target.value)}
                              >
                                <option value="">Select or type a role...</option>
                                {ALL_DESIGNATION_OPTIONS.filter((d) => !roles.includes(d)).map((d) => (
                                  <option key={d} value={d}>{d}</option>
                                ))}
                              </select>
                              <input
                                className={styles.input}
                                style={{ maxWidth: 180 }}
                                value={newRoleName}
                                onChange={(e) => setNewRoleName(e.target.value)}
                                placeholder="Or type custom role"
                              />
                              <button
                                className={styles.button}
                                type="button"
                                disabled={deptSaving}
                                onClick={async () => {
                                  const role = newRoleName.trim();
                                  if (!role) { setMessage("Role name is required."); return; }
                                  if (roles.includes(role)) { setMessage("Role already added to this department."); return; }
                                  const updated = {
                                    ...deptDesignations,
                                    [dept]: [...roles, role],
                                  };
                                  setDeptDesignations(updated);
                                  setNewRoleName("");
                                  await saveDeptMap(updated);
                                }}
                              >
                                {deptSaving ? "..." : "Add Role"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : activeTab === "System Roles" ? (
        <div className={styles.profileSection}>
          <div className={styles.sectionTitle}>System Roles</div>
          <div className={styles.infoNote}>

            <strong>Reminder:</strong> Make sure to add essential roles in any departments —{" "}
            <span className={styles.infoNoteTag}>Admin</span>{" "}
            <span className={styles.infoNoteTag}>Teacher</span>{" "}
            <span className={styles.infoNoteTag}>Driver</span>{" "}
            <span className={styles.infoNoteTag}>Warden</span>{" "}
            <span className={styles.infoNoteTag}>Student</span>{" "}
            <span className={styles.infoNoteTag}>Parent</span>
      
          </div>

          {/* Add Role */}
          <div className={styles.fieldGrid}>
            <label className={styles.label}>
              Role Name <span className={styles.requiredMark}>*</span>
              <input
                className={styles.input}
                value={newRoleInput}
                onChange={(e) => setNewRoleInput(e.target.value)}
                placeholder="e.g. driver, warden, accountant"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    document.getElementById("addSystemRoleBtn")?.click();
                  }
                }}
              />
            </label>
          </div>
          <div className={styles.formActions}>
            <button
              id="addSystemRoleBtn"
              className={styles.button}
              type="button"
              disabled={systemRoleSaving}
              onClick={async () => {
                const name = newRoleInput.trim().toLowerCase();
                if (!name) { setMessage("Role name is required."); return; }
                setSystemRoleSaving(true);
                const token = window.localStorage.getItem("authToken");
                const res = await fetch(apiUrl("/api/system-roles"), {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                  },
                  body: JSON.stringify({ name }),
                });
                if (res.ok) {
                  const created = await res.json();
                  setSystemRoles((prev) => [...prev, created]);
                  setNewRoleInput("");
                  setMessage("Role added.");
                } else {
                  const err = await res.json().catch(() => ({}));
                  setMessage(err?.message ?? "Failed to add role.");
                }
                setSystemRoleSaving(false);
              }}
            >
              {systemRoleSaving ? "Saving..." : "Add Role"}
            </button>
          </div>

          {/* Roles list */}
          {systemRolesLoading ? (
            <div className={styles.loadingCard}>
              <div className={styles.skeletonTitle} />
              <div className={styles.skeletonLine} />
            </div>
          ) : systemRoles.length === 0 ? (
            <div className={styles.empty}>No system roles added yet.</div>
          ) : (
            <div className={styles.tableResponsive}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Role Name</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {systemRoles.map((role, idx) => (
                    <tr key={role.id}>
                      <td>{idx + 1}</td>
                      <td style={{ textTransform: "capitalize" }}>{role.name}</td>
                      <td>
                        <button
                          className={styles.inlineButtonDelete}
                          type="button"
                          onClick={() =>
                            setConfirmDialog({
                              title: "Delete Role",
                              lines: [`Delete role "${role.name}"? This cannot be undone.`],
                              onConfirm: async () => {
                                setConfirmDialog(null);
                                const token = window.localStorage.getItem("authToken");
                                const res = await fetch(apiUrl(`/api/system-roles/${role.id}`), {
                                  method: "DELETE",
                                  headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                                });
                                if (res.ok) {
                                  setSystemRoles((prev) => prev.filter((r) => r.id !== role.id));
                                  setMessage("Role deleted.");
                                } else {
                                  setMessage("Failed to delete role.");
                                }
                              },
                            })
                          }
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}

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
