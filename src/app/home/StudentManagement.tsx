"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "../styles/home.module.css";
import type { Student } from "./data";
import StudentProfileModal from "./StudentProfileModal";

const tabs = ["Add Student", "List Students"] as const;
const pageSizeOptions = [10, 25, 50] as const;

const sortFields = [
  "name",
  "classCode",
  "gender",
  "admissionNumber",
  "status",
] as const;

type SortField = (typeof sortFields)[number];

type StudentManagementProps = {
  students: Student[];
  onAddStudent: (student: Student) => void;
  role: string;
  username: string;
  classCode?: string;
};

type EditState = {
  id: string;
  name: string;
  grade: string;
  section: string;
  gender: "Male" | "Female";
  dateOfBirth: string;
  admissionNumber: string;
  rollNumber: string;
  address: string;
  parentName: string;
  parentRelation: string;
  parentPhone: string;
  parentEmail: string;
  parentOccupation: string;
  status: "Active" | "Inactive";
};

const csvHeaders = [
  "name",
  "grade",
  "section",
  "gender",
  "dateOfBirth",
  "admissionNumber",
  "rollNumber",
  "address",
  "parentName",
  "parentRelation",
  "parentPhone",
  "parentEmail",
  "parentOccupation",
  "status",
] as const;

function buildCsvRow(values: string[]) {
  return values
    .map((value) => {
      const safe = value.replace(/\"/g, '""');
      return safe.includes(",") || safe.includes("\n") ? `"${safe}"` : safe;
    })
    .join(",");
}

function parseCsv(text: string) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length === 0) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const columns = line.split(",");
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = (columns[index] ?? "").trim().replace(/^"|"$/g, "");
    });
    return record;
  });
}

export default function StudentManagement({
  students,
  onAddStudent,
  role,
  username,
  classCode,
}: StudentManagementProps) {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Add Student");
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("");
  const [section, setSection] = useState("");
  const [gender, setGender] = useState<"Male" | "Female">("Male");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [admissionNumber, setAdmissionNumber] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [address, setAddress] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentRelation, setParentRelation] = useState("Parent");
  const [parentPhone, setParentPhone] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentOccupation, setParentOccupation] = useState("");

  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("all");
  const [filterGender, setFilterGender] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState("asc");
  const [pageSize, setPageSize] = useState<(typeof pageSizeOptions)[number]>(10);
  const [page, setPage] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);

  useEffect(() => {
    if (!selectedStudent && !editState) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [selectedStudent, editState]);

  const hasClassLock = Boolean(classCode && classCode !== "all");
  const derivedGrade = hasClassLock ? classCode!.slice(0, -1) : grade;
  const derivedSection = hasClassLock ? classCode!.slice(-1) : section;

  const classOptions = useMemo(() => {
    const classCodes = Array.from(
      new Set(students.map((student) => student.classCode))
    ).sort();
    return classCodes;
  }, [students]);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    return students.filter((student) => {
      const matchesQuery =
        query.length === 0 ||
        student.name.toLowerCase().includes(query) ||
        student.admissionNumber.toLowerCase().includes(query) ||
        student.rollNumber.toLowerCase().includes(query);
      const matchesClass =
        filterClass === "all" || student.classCode === filterClass;
      const matchesGender =
        filterGender === "all" || student.gender === filterGender;
      const matchesStatus =
        filterStatus === "all" || student.status === filterStatus;
      return matchesQuery && matchesClass && matchesGender && matchesStatus;
    });
  }, [students, search, filterClass, filterGender, filterStatus]);

  const sortedStudents = useMemo(() => {
    const sorted = [...filteredStudents].sort((a, b) => {
      const aValue = String(a[sortField] ?? "");
      const bValue = String(b[sortField] ?? "");
      return sortDir === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });
    return sorted;
  }, [filteredStudents, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedStudents.length / pageSize));
  const pagedStudents = sortedStudents.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const handleAddStudent = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const safeGrade = derivedGrade.trim() || "-";
    const safeSection = derivedSection.trim() || "-";
    const newClassCode = `${safeGrade}${safeSection}`;

    const newStudent: Student = {
      id: crypto.randomUUID(),
      name: trimmedName,
      grade: safeGrade,
      section: safeSection,
      classCode: newClassCode,
      gender,
      dateOfBirth,
      admissionNumber: admissionNumber.trim(),
      rollNumber: rollNumber.trim(),
      address: address.trim(),
      parentName: parentName.trim(),
      parentRelation: parentRelation.trim(),
      parentPhone: parentPhone.trim(),
      parentEmail: parentEmail.trim(),
      parentOccupation: parentOccupation.trim(),
      status: "Active",
      history: ["Student record created"],
    };

    onAddStudent(newStudent);
    setName("");
    setGrade("");
    setSection("");
    setGender("Male");
    setDateOfBirth("");
    setAdmissionNumber("");
    setRollNumber("");
    setAddress("");
    setParentName("");
    setParentRelation("Parent");
    setParentPhone("");
    setParentEmail("");
    setParentOccupation("");
    setActiveTab("List Students");
  };

  const handleStartEdit = (student: Student) => {
    setEditState({
      id: student.id,
      name: student.name,
      grade: student.grade,
      section: student.section,
      gender: student.gender,
      dateOfBirth: student.dateOfBirth,
      admissionNumber: student.admissionNumber,
      rollNumber: student.rollNumber,
      address: student.address,
      parentName: student.parentName,
      parentRelation: student.parentRelation,
      parentPhone: student.parentPhone,
      parentEmail: student.parentEmail,
      parentOccupation: student.parentOccupation,
      status: student.status,
    });
  };

  const handleSaveEdit = () => {
    if (!editState) return;
    const updated: Student = {
      ...students.find((student) => student.id === editState.id)!,
      ...editState,
      classCode: `${editState.grade}${editState.section}`,
      history: [
        ...(students.find((student) => student.id === editState.id)?.history ?? []),
        "Student record updated",
      ],
    };
    onAddStudent(updated);
    setEditState(null);
  };

  const handleExport = () => {
    const headerRow = buildCsvRow([...csvHeaders]);
    const rows = sortedStudents.map((student) =>
      buildCsvRow([
        student.name,
        student.grade,
        student.section,
        student.gender,
        student.dateOfBirth,
        student.admissionNumber,
        student.rollNumber,
        student.address,
        student.parentName,
        student.parentRelation,
        student.parentPhone,
        student.parentEmail,
        student.parentOccupation,
        student.status,
      ])
    );
    const csv = [headerRow, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "students.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const records = parseCsv(text);
    records.forEach((record) => {
      const importGrade = hasClassLock ? derivedGrade : record.grade ?? "-";
      const importSection = hasClassLock ? derivedSection : record.section ?? "-";
      const newStudent: Student = {
        id: crypto.randomUUID(),
        name: record.name ?? "",
        grade: importGrade,
        section: importSection,
        classCode: `${importGrade}${importSection}`,
        gender: (record.gender as "Male" | "Female") ?? "Male",
        dateOfBirth: record.dateOfBirth ?? "",
        admissionNumber: record.admissionNumber ?? "",
        rollNumber: record.rollNumber ?? "",
        address: record.address ?? "",
        parentName: record.parentName ?? "",
        parentRelation: record.parentRelation ?? "Parent",
        parentPhone: record.parentPhone ?? "",
        parentEmail: record.parentEmail ?? "",
        parentOccupation: record.parentOccupation ?? "",
        status: record.status === "Inactive" ? "Inactive" : "Active",
        history: ["Imported from CSV"],
      };
      onAddStudent(newStudent);
    });
    event.target.value = "";
  };

  const handleUpsertStudent = (student: Student) => {
    onAddStudent(student);
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
          <div className={styles.sectionTitle}>Student Details</div>
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
              Gender
              <select
                className={styles.input}
                value={gender}
                onChange={(event) =>
                  setGender(event.target.value as "Male" | "Female")
                }
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </label>

            <label className={styles.label}>
              Date of Birth
              <input
                className={styles.input}
                type="date"
                value={dateOfBirth}
                onChange={(event) => setDateOfBirth(event.target.value)}
              />
            </label>

            <label className={styles.label}>
              Admission Number
              <input
                className={styles.input}
                type="text"
                value={admissionNumber}
                onChange={(event) => setAdmissionNumber(event.target.value)}
              />
            </label>

            <label className={styles.label}>
              Roll Number
              <input
                className={styles.input}
                type="text"
                value={rollNumber}
                onChange={(event) => setRollNumber(event.target.value)}
              />
            </label>

            <label className={styles.label}>
              Address
              <input
                className={styles.input}
                type="text"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
              />
            </label>
          </div>

          <div className={styles.sectionTitle}>Class Details</div>
          <div className={styles.fieldRow}>
            <label className={styles.label}>
              Grade
              <input
                className={styles.input}
                type="text"
                value={derivedGrade}
                onChange={(event) => setGrade(event.target.value)}
                disabled={hasClassLock}
              />
            </label>

            <label className={styles.label}>
              Section
              <input
                className={styles.input}
                type="text"
                value={derivedSection}
                onChange={(event) => setSection(event.target.value)}
                disabled={hasClassLock}
              />
            </label>
          </div>

          <div className={styles.sectionTitle}>Parent/Guardian Details</div>
          <div className={styles.fieldRow}>
            <label className={styles.label}>
              Parent Name
              <input
                className={styles.input}
                type="text"
                value={parentName}
                onChange={(event) => setParentName(event.target.value)}
              />
            </label>

            <label className={styles.label}>
              Relation
              <select
                className={styles.input}
                value={parentRelation}
                onChange={(event) => setParentRelation(event.target.value)}
              >
                <option value="Parent">Parent</option>
                <option value="Mother">Mother</option>
                <option value="Father">Father</option>
                <option value="Guardian">Guardian</option>
              </select>
            </label>

            <label className={styles.label}>
              Phone
              <input
                className={styles.input}
                type="tel"
                value={parentPhone}
                onChange={(event) => setParentPhone(event.target.value)}
              />
            </label>

            <label className={styles.label}>
              Email
              <input
                className={styles.input}
                type="email"
                value={parentEmail}
                onChange={(event) => setParentEmail(event.target.value)}
              />
            </label>

            <label className={styles.label}>
              Occupation
              <input
                className={styles.input}
                type="text"
                value={parentOccupation}
                onChange={(event) => setParentOccupation(event.target.value)}
              />
            </label>
          </div>

          <button className={styles.button} type="submit">
            Add Student
          </button>
        </form>
      ) : (
        <div className={styles.listLayout}>
          <section className={styles.listPane}>
            <div className={styles.listToolbar}>
              <input
                className={styles.searchInput}
                type="search"
                placeholder="Search name, admission #, roll #"
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
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
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
              </div>
              <div className={styles.listActions}>
                <button className={styles.inlineButton} type="button" onClick={handleExport}>
                  Export CSV
                </button>
                <label className={styles.inlineButton}>
                  Import CSV
                  <input
                    className={styles.hiddenInput}
                    type="file"
                    accept=".csv"
                    onChange={handleImport}
                  />
                </label>
              </div>
            </div>

            {pagedStudents.length === 0 ? (
              <div className={styles.empty}>No students found.</div>
            ) : (
              <div className={styles.tableResponsive}>
                <table className={styles.table}>
                  <thead>
                  <tr>
                    <th>Name</th>
                    <th>Class</th>
                    <th>Roll #</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                  </thead>
                  <tbody>
                  {pagedStudents.map((student) => (
                    <tr key={student.id}>
                      <td
                        data-label="Name"
                        className={styles.rowClickable}
                        onClick={() => setSelectedStudent(student)}
                      >
                        {student.name}
                      </td>
                      <td data-label="Class">{student.classCode}</td>
                      <td data-label="Roll #">{student.rollNumber || "-"}</td>
                      <td data-label="Status">{student.status}</td>
                      <td data-label="Actions">
                          <div className={styles.actionRow}>
                            <button
                              className={styles.inlineButton}
                              type="button"
                              onClick={() => handleStartEdit(student)}
                          >
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
                <select
                  className={styles.inlineSelect}
                  value={pageSize}
                  onChange={(event) => {
                    setPageSize(Number(event.target.value) as (typeof pageSizeOptions)[number]);
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
          </section>
        </div>
      )}

      {selectedStudent ? (
        <StudentProfileModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      ) : null}

      {editState ? (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <div>
                <h3>Edit Student</h3>
                <p className={styles.modalSubtitle}>
                  Update student details and status.
                </p>
              </div>
              <button
                className={styles.inlineButton}
                type="button"
                onClick={() => setEditState(null)}
              >
                Close
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.profileSection}>
                <div className={styles.sectionTitle}>Core Details</div>
                <div className={styles.profileGrid}>
                  <label className={styles.label}>
                    Name
                    <input
                      className={styles.input}
                      value={editState.name}
                      onChange={(event) =>
                        setEditState({ ...editState, name: event.target.value })
                      }
                    />
                  </label>
                  <label className={styles.label}>
                    Grade
                    <input
                      className={styles.input}
                      value={editState.grade}
                      onChange={(event) =>
                        setEditState({ ...editState, grade: event.target.value })
                      }
                      disabled={hasClassLock}
                    />
                  </label>
                  <label className={styles.label}>
                    Section
                    <input
                      className={styles.input}
                      value={editState.section}
                      onChange={(event) =>
                        setEditState({ ...editState, section: event.target.value })
                      }
                      disabled={hasClassLock}
                    />
                  </label>
                  <label className={styles.label}>
                    Status
                    <select
                      className={styles.input}
                      value={editState.status}
                      onChange={(event) =>
                        setEditState({
                          ...editState,
                          status: event.target.value as "Active" | "Inactive",
                        })
                      }
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </label>
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
            
              <button className={styles.button} type="button" onClick={handleSaveEdit}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
