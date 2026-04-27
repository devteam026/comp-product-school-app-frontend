"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "../styles/home.module.css";
import type { Student } from "./data";
import StudentProfileModal from "./StudentProfileModal";
import { apiUrl } from "../../lib/api";

const tabs = ["Add Student", "List Students"] as const;
const pageSizeOptions = [10, 25, 50] as const;

const sortFields = [
  "name",
  "classCode",
  "gender",
  "admissionNumber",
  "status",
] as const;

const relationOptions = [
  "Parent",
  "Mother",
  "Father",
  "Guardian",
  "Aunt",
  "Uncle",
  "Grandparent",
  "Sibling",
  "Cousin",
  "Other",
] as const;

type SortField = (typeof sortFields)[number];

type StudentManagementProps = {
  students: Student[];
  onAddStudent: (student: Student) => Promise<{ ok: boolean; student?: Student | null; error?: string }>;
  role: string;
  username: string;
  classCode?: string;
  isLoading?: boolean;
};

type GuardianInfo = {
  id: string;
  parentName?: string;
  parentRelation?: string;
  parentPhone?: string;
  parentWhatsapp?: string;
  parentEmail?: string;
  parentOccupation?: string;
  fatherName?: string;
  motherName?: string;
};

type EditState = {
  id: string;
  name: string;
  grade: string;
  section: string;
  gender: "Male" | "Female";
  dateOfBirth: string;
  admissionNumber: string;
  registerNo: string;
  rollNumber: string;
  address: string;
  session: string;
  fatherName: string;
  motherName: string;
  parentName: string;
  parentRelation: string;
  parentPhone: string;
  parentWhatsapp: string;
  parentEmail: string;
  parentOccupation: string;
  transportRequired: boolean;
  transportRoute: string;
  transportVehicleNo: string;
  transportStopName: string;
  hostelRequired: boolean;
  hostelName: string;
  hostelRoomNo: string;
  previousSchoolName: string;
  previousQualification: string;
  status: "Active" | "Inactive";
  profilePhotoKey?: string;
};

const csvHeaders = [
  "name",
  "grade",
  "section",
  "gender",
  "dateOfBirth",
  "admissionNumber",
  "registerNo",
  "rollNumber",
  "address",
  "session",
  "fatherName",
  "motherName",
  "parentName",
  "parentRelation",
  "parentPhone",
  "parentWhatsapp",
  "parentEmail",
  "parentOccupation",
  "transportRequired",
  "transportRoute",
  "transportVehicleNo",
  "transportStopName",
  "hostelRequired",
  "hostelName",
  "hostelRoomNo",
  "previousSchoolName",
  "previousQualification",
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
  isLoading,
}: StudentManagementProps) {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Add Student");
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("");
  const [section, setSection] = useState("");
  const [gender, setGender] = useState<"Male" | "Female">("Male");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [admissionNumber, setAdmissionNumber] = useState("");
  const [registerNo, setRegisterNo] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [address, setAddress] = useState("");
  const [session, setSession] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [motherName, setMotherName] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentRelation, setParentRelation] = useState("Parent");
  const [parentPhone, setParentPhone] = useState("");
  const [parentWhatsapp, setParentWhatsapp] = useState("");
  const [whatsappSame, setWhatsappSame] = useState(false);
  const [parentEmail, setParentEmail] = useState("");
  const [parentOccupation, setParentOccupation] = useState("");
  const [profilePhotoKey, setProfilePhotoKey] = useState<string | null>(null);
  const [transportRequired, setTransportRequired] = useState(false);
  const [transportRoute, setTransportRoute] = useState("");
  const [transportVehicleNo, setTransportVehicleNo] = useState("");
  const [transportStopName, setTransportStopName] = useState("");
  const [hostelRequired, setHostelRequired] = useState(false);
  const [hostelName, setHostelName] = useState("");
  const [hostelRoomNo, setHostelRoomNo] = useState("");
  const [previousSchoolName, setPreviousSchoolName] = useState("");
  const [previousQualification, setPreviousQualification] = useState("");
  const [enableStudentLogin, setEnableStudentLogin] = useState(false);
  const [studentPassword, setStudentPassword] = useState("");
  const [studentPasswordConfirm, setStudentPasswordConfirm] = useState("");
  const [studentLoginError, setStudentLoginError] = useState<string | null>(null);
  const [editStudentPassword, setEditStudentPassword] = useState("");
  const [editStudentPasswordConfirm, setEditStudentPasswordConfirm] = useState("");
  const [editLoginError, setEditLoginError] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [editPhotoUrl, setEditPhotoUrl] = useState<string | null>(null);
  const [editPhotoLoading, setEditPhotoLoading] = useState(false);
  const [editPhotoPreview, setEditPhotoPreview] = useState<string | null>(null);
  const [editPhotoUploading, setEditPhotoUploading] = useState(false);
  const [editPhotoError, setEditPhotoError] = useState<string | null>(null);
  const [editSaveStatus, setEditSaveStatus] = useState<
    "idle" | "saving" | "success" | "error"
  >("idle");
  const [editSaveMessage, setEditSaveMessage] = useState<string | null>(null);
  const [addSaveMessage, setAddSaveMessage] = useState<string | null>(null);
  const [addSaveStatus, setAddSaveStatus] = useState<"success" | "error" | null>(null);
  const [listMessage, setListMessage] = useState<string | null>(null);
  const [addValidationError, setAddValidationError] = useState<string | null>(null);
  const [editValidationError, setEditValidationError] = useState<string | null>(null);

  const showAddMessage = (text: string, type: "success" | "error" = "success") => {
    setAddSaveMessage(text);
    setAddSaveStatus(type);
    setTimeout(() => { setAddSaveMessage(null); setAddSaveStatus(null); }, 4000);
  };

  const showEditMessage = (text: string, status: "success" | "error") => {
    setEditSaveMessage(text);
    setEditSaveStatus(status);
    setTimeout(() => { setEditSaveMessage(null); setEditSaveStatus("idle"); }, 4000);
  };

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
  const [sessionWarning, setSessionWarning] = useState<string | null>(null);
  const [hostelSyncError, setHostelSyncError] = useState<string | null>(null);

  const [guardianQuery, setGuardianQuery] = useState("");
  const [guardianResults, setGuardianResults] = useState<GuardianInfo[]>([]);
  const [guardianLoading, setGuardianLoading] = useState(false);
  const [guardianError, setGuardianError] = useState<string | null>(null);
  const [guardianExisting, setGuardianExisting] = useState(false);

  const [classOptions, setClassOptions] = useState<
    { classCode: string; grade: string; section: string }[]
  >([]);
  const [transportRoutes, setTransportRoutes] = useState<string[]>([]);
  const [transportVehicles, setTransportVehicles] = useState<string[]>([]);
  const [transportStops, setTransportStops] = useState<string[]>([]);
  const [hostelOptions, setHostelOptions] = useState<string[]>([]);
  const [hostelRooms, setHostelRooms] = useState<string[]>([]);
  const transportStopOptions = useMemo(() => {
    const options = [...transportStops];
    if (transportStopName && !options.includes(transportStopName)) {
      options.unshift(transportStopName);
    }
    return options;
  }, [transportStops, transportStopName]);
  const editTransportStopOptions = useMemo(() => {
    const options = [...transportStops];
    if (editState?.transportStopName && !options.includes(editState.transportStopName)) {
      options.unshift(editState.transportStopName);
    }
    return options;
  }, [transportStops, editState?.transportStopName]);

  useEffect(() => {
    if (!selectedStudent && !editState) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [selectedStudent, editState]);

  useEffect(() => {
    if (!guardianQuery.trim()) {
      setGuardianResults([]);
      setGuardianError(null);
      return;
    }
    let isActive = true;
    setGuardianLoading(true);
    setGuardianError(null);
    const timeout = window.setTimeout(() => {
      const token = window.localStorage.getItem("authToken");
      fetch(apiUrl(`/api/students/guardians?q=${encodeURIComponent(guardianQuery)}`), {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed"))))
        .then((data) => {
          if (!isActive) return;
          setGuardianResults(Array.isArray(data) ? data : []);
        })
        .catch(() => {
          if (!isActive) return;
          setGuardianResults([]);
          setGuardianError("Unable to load guardians. Try again.");
        })
        .finally(() => {
          if (isActive) setGuardianLoading(false);
        });
    }, 300);
    return () => {
      isActive = false;
      window.clearTimeout(timeout);
    };
  }, [guardianQuery]);

  useEffect(() => {
    let isActive = true;
    const token = window.localStorage.getItem("authToken");
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    Promise.all([
      fetch(apiUrl("/api/student-options/transport/routes"), { headers })
        .then((res) => (res.ok ? res.json() : []))
        .catch(() => []),
      fetch(apiUrl("/api/student-options/hostels"), { headers })
        .then((res) => (res.ok ? res.json() : []))
        .catch(() => []),
    ]).then(([routes, hostels]) => {
      if (!isActive) return;
      setTransportRoutes(Array.isArray(routes) ? routes : []);
      setHostelOptions(Array.isArray(hostels) ? hostels : []);
    });
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    const activeRoute = transportRequired
      ? transportRoute
      : editState?.transportRoute ?? "";
    if (!transportRequired && !editState?.transportRequired) {
      setTransportVehicles([]);
      return;
    }
    const token = window.localStorage.getItem("authToken");
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    const routeParam = activeRoute ? `?route=${encodeURIComponent(activeRoute)}` : "";
    fetch(apiUrl(`/api/student-options/transport/vehicles${routeParam}`), { headers })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setTransportVehicles(Array.isArray(data) ? data : []))
      .catch(() => setTransportVehicles([]));
  }, [transportRequired, transportRoute, editState?.transportRoute, editState?.transportRequired]);

  useEffect(() => {
    const activeRoute = transportRequired
      ? transportRoute
      : editState?.transportRoute ?? "";
    if (!transportRequired && !editState?.transportRequired) {
      setTransportStops([]);
      return;
    }
    const token = window.localStorage.getItem("authToken");
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    const routeParam = activeRoute ? `?route=${encodeURIComponent(activeRoute)}` : "";
    fetch(apiUrl(`/api/student-options/transport/stoppages${routeParam}`), { headers })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) =>
        setTransportStops(
          Array.isArray(data)
            ? [...data].sort((a, b) => a.localeCompare(b))
            : []
        )
      )
      .catch(() => setTransportStops([]));
  }, [transportRequired, transportRoute, editState?.transportRoute, editState?.transportRequired]);

  useEffect(() => {
    const activeHostel = hostelRequired
      ? hostelName
      : editState?.hostelName ?? "";
    if (!hostelRequired && !editState?.hostelRequired) {
      setHostelRooms([]);
      return;
    }
    const token = window.localStorage.getItem("authToken");
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    const hostelParam = activeHostel ? `?hostel=${encodeURIComponent(activeHostel)}` : "";
    const availabilityParam = hostelParam ? `${hostelParam}&onlyAvailable=true` : "?onlyAvailable=true";
    fetch(apiUrl(`/api/student-options/hostels/rooms${availabilityParam}`), { headers })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setHostelRooms(Array.isArray(data) ? data : []))
      .catch(() => setHostelRooms([]));
  }, [hostelRequired, hostelName, editState?.hostelName, editState?.hostelRequired]);

  useEffect(() => {
    if (hostelOptions.length > 0) return;
    if (!hostelRequired) return;
    // Hostels list is expected from API; if it's empty, data likely not seeded.
  }, [hostelOptions.length, hostelRequired]);

  const hasClassLock = Boolean(classCode && classCode !== "all");
  const parseClassCode = (code: string) => {
    const trimmed = code.trim();
    const match = trimmed.match(/^(\d+)([A-Za-z])$/);
    if (match) {
      return { grade: match[1], section: match[2] };
    }
    return { grade: trimmed, section: "" };
  };
  const lockedParsed = hasClassLock ? parseClassCode(classCode!) : null;
  const derivedGrade = hasClassLock ? lockedParsed!.grade : grade;
  const derivedSection = hasClassLock ? lockedParsed!.section : section;
  const displayLockedSection = hasClassLock
    ? derivedSection || "N/A"
    : derivedSection;
  const hasSelectedClass = Boolean(derivedGrade.trim());

  const sessionOptions = useMemo(() => {
    const year = new Date().getFullYear();
    return [
      `${year - 1}-${year}`,
      `${year}-${year + 1}`,
      `${year + 1}-${year + 2}`,
    ];
  }, []);

  useEffect(() => {
    if (hasSelectedClass && sessionWarning) {
      setSessionWarning(null);
    }
  }, [hasSelectedClass, sessionWarning]);

  useEffect(() => {
    let isActive = true;
    const token = window.localStorage.getItem("authToken");
    fetch(apiUrl("/api/classes/manage"), {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
      .then((res) => {
        if (res.ok) return res.json();
        return fetch(apiUrl("/api/classes"), {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }).then((fallback) => (fallback.ok ? fallback.json() : []));
      })
      .then((data) => {
        if (!isActive) return;
        const list = Array.isArray(data) ? data : [];
        const mapped = list.map((item) => {
          const classCode = item.classCode ?? item ?? "";
          const parsed = parseClassCode(classCode);
          return {
            classCode,
            grade: item.name ?? item.grade ?? parsed.grade,
            section: item.section ?? parsed.section ?? "",
          };
        });
        setClassOptions(mapped.filter((item) => item.classCode));
      })
      .catch(() => {
        if (!isActive) return;
        setClassOptions([]);
      });
    return () => {
      isActive = false;
    };
  }, []);

  const resolvedClassOptions = useMemo(() => {
    if (classOptions.length > 0) return classOptions;
    const codes = Array.from(new Set(students.map((student) => student.classCode)));
    return codes.map((code) => {
      const parsed = parseClassCode(code);
      return { classCode: code, grade: parsed.grade, section: parsed.section };
    });
  }, [classOptions, students]);

  const gradeOptions = useMemo(() => {
    const grades = resolvedClassOptions.map((item) => item.grade).filter(Boolean);
    return Array.from(new Set(grades)).sort();
  }, [resolvedClassOptions]);

  const sectionOptions = useMemo(() => {
    if (!derivedGrade) return [];
    return resolvedClassOptions
      .filter((item) => item.grade === derivedGrade)
      .map((item) => item.section || "N/A")
      .filter(Boolean)
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort();
  }, [resolvedClassOptions, derivedGrade]);

  const gradeOptionsWithLock = useMemo(() => {
    if (hasClassLock && derivedGrade && !gradeOptions.includes(derivedGrade)) {
      return [derivedGrade, ...gradeOptions];
    }
    return gradeOptions;
  }, [hasClassLock, derivedGrade, gradeOptions]);

  const sectionOptionsWithLock = useMemo(() => {
    if (hasClassLock && displayLockedSection && !sectionOptions.includes(displayLockedSection)) {
      return [displayLockedSection, ...sectionOptions];
    }
    return sectionOptions;
  }, [hasClassLock, displayLockedSection, sectionOptions]);

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

  const syncHostelAllocation = async (
    studentId: string,
    required: boolean,
    hostel: string,
    room: string
  ) => {
    setHostelSyncError(null);
    const token = window.localStorage.getItem("authToken");
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    try {
      if (!required) {
        const response = await fetch(
          apiUrl(`/api/hostels/manage/allocations/by-student/${studentId}`),
          { method: "DELETE", headers }
        );
        if (!response.ok && response.status !== 404) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err?.error ?? "Unable to clear hostel allocation");
        }
        return;
      }
      const response = await fetch(apiUrl("/api/hostels/manage/allocations/by-student"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(headers ?? {}),
        },
        body: JSON.stringify({
          studentId,
          hostelName: hostel,
          roomNumber: room,
        }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error ?? "Unable to save hostel allocation");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Hostel sync failed";
      setHostelSyncError(message);
    }
  };

  const scrollToField = (id: string) => {
    setTimeout(() => {
      // Scroll to the error banner below the submit button so it's visible
      document.getElementById("add-validation-error")?.scrollIntoView({ behavior: "smooth", block: "center" });
      // Then highlight the problematic field
      document.getElementById(id)?.focus();
    }, 100);
  };

  const handleAddStudent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAddValidationError(null);
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const safeGrade = derivedGrade.trim() || "-";
    const normalizedSection = derivedSection.trim() || "N/A";
    const newClassCode =
      normalizedSection === "N/A" ? safeGrade : `${safeGrade}${normalizedSection}`;
    if (!hasSelectedClass) {
      setSessionWarning("Select class first, then choose session.");
      return;
    }

    // Profile photo required
    if (!profilePhotoKey) {
      setAddValidationError("Profile photo is required. Please upload a photo.");
      scrollToField("field-photo");
      return;
    }

    // DOB year must be 4 digits
    if (dateOfBirth) {
      const dobYear = parseInt(dateOfBirth.split("-")[0], 10);
      if (isNaN(dobYear) || String(dobYear).length !== 4 || dobYear < 1900 || dobYear > 2099) {
        setAddValidationError("Date of Birth year must be a valid 4-digit year (e.g. 2010).");
        scrollToField("field-dob");
        return;
      }
    }

    // Father name required
    if (!fatherName.trim()) {
      setAddValidationError("Father Name is required.");
      scrollToField("field-fatherName");
      return;
    }

    // Mother name required
    if (!motherName.trim()) {
      setAddValidationError("Mother Name is required.");
      scrollToField("field-motherName");
      return;
    }

    // Mobile required and 10 digits
    if (!parentPhone.trim()) {
      setAddValidationError("Mobile number is required.");
      scrollToField("field-phone");
      return;
    }
    if (parentPhone.replace(/\D/g, "").length !== 10) {
      setAddValidationError("Mobile number must be exactly 10 digits.");
      scrollToField("field-phone");
      return;
    }

    // Transport stop required when transport enabled
    if (transportRequired && !transportStopName.trim()) {
      setAddValidationError("Please select a Transport Stop since transport is required.");
      scrollToField("field-transportStop");
      return;
    }

    // Duplicate roll number in same class
    if (rollNumber.trim()) {
      const duplicateRoll = students.find(
        (s) =>
          s.rollNumber.trim().toLowerCase() === rollNumber.trim().toLowerCase() &&
          s.classCode === newClassCode
      );
      if (duplicateRoll) {
        setAddValidationError(
          `Roll number "${rollNumber.trim()}" is already assigned to "${duplicateRoll.name}" in class ${newClassCode}.`
        );
        scrollToField("field-rollNumber");
        return;
      }
    }

    if (enableStudentLogin && studentPassword !== studentPasswordConfirm) {
      setStudentLoginError("Passwords do not match.");
      return;
    }

    const newStudent: Student = {
      id: (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`),
      name: trimmedName,
      grade: safeGrade,
      section: normalizedSection,
      classCode: newClassCode,
      gender,
      dateOfBirth,
      admissionNumber: admissionNumber.trim(),
      registerNo: registerNo.trim(),
      rollNumber: rollNumber.trim(),
      address: address.trim(),
      session: session.trim(),
      fatherName: fatherName.trim(),
      motherName: motherName.trim(),
      parentName: parentName.trim(),
      parentRelation: parentRelation.trim(),
      parentPhone: parentPhone.trim(),
      parentWhatsapp: parentWhatsapp.trim(),
      parentEmail: parentEmail.trim(),
      parentOccupation: parentOccupation.trim(),
      transportRequired,
      transportRoute: transportRoute.trim(),
      transportVehicleNo: transportVehicleNo.trim(),
      transportStopName: transportStopName.trim(),
      hostelRequired,
      hostelName: hostelName.trim(),
      hostelRoomNo: hostelRoomNo.trim(),
      previousSchoolName: previousSchoolName.trim(),
      previousQualification: previousQualification.trim(),
      studentPassword: enableStudentLogin ? studentPassword : "",
      status: "Active",
      feeType: "Paid",
      history: ["Student record created"],
      profilePhotoKey: profilePhotoKey ?? undefined,
    };

    const addResult = await onAddStudent(newStudent);
    if (addResult.ok) {
      const studentId = addResult.student?.id ?? newStudent.id;
      if (hostelRequired || hostelName || hostelRoomNo) {
        await syncHostelAllocation(
          studentId,
          hostelRequired,
          hostelName.trim(),
          hostelRoomNo.trim()
        );
      }
      showAddMessage(`Student "${trimmedName}" added successfully.`);
    } else {
      showAddMessage(addResult.error ?? "Failed to add student. Please try again.", "error");
      return;
    }
    setName("");
    setGrade("");
    setSection("");
    setGender("Male");
    setDateOfBirth("");
    setAdmissionNumber("");
    setRegisterNo("");
    setRollNumber("");
    setAddress("");
    setSession("");
    setFatherName("");
    setMotherName("");
    setParentName("");
    setParentRelation("Parent");
    setParentPhone("");
    setParentWhatsapp("");
    setWhatsappSame(false);
    setParentEmail("");
    setParentOccupation("");
    setTransportRequired(false);
    setTransportRoute("");
    setTransportVehicleNo("");
    setTransportStopName("");
    setHostelRequired(false);
    setHostelName("");
    setHostelRoomNo("");
    setHostelSyncError(null);
    setPreviousSchoolName("");
    setPreviousQualification("");
    setEnableStudentLogin(false);
    setStudentPassword("");
    setStudentPasswordConfirm("");
    setStudentLoginError(null);
    setProfilePhotoKey(null);
    setPhotoPreview(null);
    setPhotoError(null);
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhotoError(null);
    setPhotoUploading(true);
    try {
      const token = window.localStorage.getItem("authToken");
      const formData = new FormData();
      formData.append("file", file);
      const uploadRequest = await fetch(apiUrl("/api/students/photo-upload"), {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      });
      if (!uploadRequest.ok) {
        const err = await uploadRequest.json().catch(() => ({}));
        throw new Error(err?.error ?? "Unable to upload photo");
      }
      const { objectKey } = await uploadRequest.json();
      setProfilePhotoKey(objectKey);
      setPhotoPreview(URL.createObjectURL(file));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setPhotoError(message);
    } finally {
      setPhotoUploading(false);
      event.target.value = "";
    }
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
      registerNo: student.registerNo ?? "",
      rollNumber: student.rollNumber,
      address: student.address,
      session: student.session ?? "",
      fatherName: student.fatherName ?? "",
      motherName: student.motherName ?? "",
      parentName: student.parentName,
      parentRelation: student.parentRelation,
      parentPhone: student.parentPhone,
      parentWhatsapp: student.parentWhatsapp ?? "",
      parentEmail: student.parentEmail,
      parentOccupation: student.parentOccupation,
      transportRequired: student.transportRequired ?? false,
      transportRoute: student.transportRoute ?? "",
      transportVehicleNo: student.transportVehicleNo ?? "",
      transportStopName: student.transportStopName ?? "",
      hostelRequired: student.hostelRequired ?? false,
      hostelName: student.hostelName ?? "",
      hostelRoomNo: student.hostelRoomNo ?? "",
      previousSchoolName: student.previousSchoolName ?? "",
      previousQualification: student.previousQualification ?? "",
      status: student.status,
      profilePhotoKey: student.profilePhotoKey,
    });
    setEditStudentPassword("");
    setEditStudentPasswordConfirm("");
    setEditLoginError(null);
    setEditPhotoPreview(null);
    setEditPhotoUrl(null);
    setEditPhotoError(null);
    setEditPhotoLoading(false);
    setEditSaveStatus("idle");
    setEditSaveMessage(null);
    setHostelSyncError(null);
    if (student.profilePhotoKey) {
      setEditPhotoLoading(true);
      const token = window.localStorage.getItem("authToken");
      fetch(apiUrl(`/api/students/${student.id}/photo-url`), {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.url) setEditPhotoUrl(data.url);
        })
        .catch(() => {
          // ignore
        })
        .finally(() => {
          setEditPhotoLoading(false);
        });
    }
  };

  const editValidationFail = (message: string, fieldId: string) => {
    setEditValidationError(message);
    setTimeout(() => {
      document.getElementById("edit-validation-error")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      document.getElementById(fieldId)?.focus();
    }, 100);
  };

  const handleSaveEdit = async () => {
    if (!editState) return;
    setEditValidationError(null);

    // Name required
    if (!editState.name.trim()) {
      editValidationFail("Student Name is required.", "edit-field-name");
      return;
    }

    // DOB year must be 4 digits
    if (editState.dateOfBirth) {
      const dobYear = parseInt(editState.dateOfBirth.split("-")[0], 10);
      if (isNaN(dobYear) || String(dobYear).length !== 4 || dobYear < 1900 || dobYear > 2099) {
        editValidationFail("Date of Birth year must be a valid 4-digit year (e.g. 2010).", "edit-field-dob");
        return;
      }
    }

    // Father name required
    if (!editState.fatherName.trim()) {
      editValidationFail("Father Name is required.", "edit-field-fatherName");
      return;
    }

    // Mother name required
    if (!editState.motherName.trim()) {
      editValidationFail("Mother Name is required.", "edit-field-motherName");
      return;
    }

    // Mobile required and 10 digits
    if (!editState.parentPhone.trim()) {
      editValidationFail("Mobile number is required.", "edit-field-phone");
      return;
    }
    if (editState.parentPhone.replace(/\D/g, "").length !== 10) {
      editValidationFail("Mobile number must be exactly 10 digits.", "edit-field-phone");
      return;
    }

    // Transport stop required when transport enabled
    if (editState.transportRequired && !editState.transportStopName.trim()) {
      editValidationFail("Please select a Transport Stop since transport is required.", "edit-field-transportStop");
      return;
    }

    // Duplicate roll number in same class
    if (editState.rollNumber.trim()) {
      const editClassCode =
        editState.section === "N/A" ? editState.grade : `${editState.grade}${editState.section}`;
      const duplicateRoll = students.find(
        (s) =>
          s.id !== editState.id &&
          s.rollNumber.trim().toLowerCase() === editState.rollNumber.trim().toLowerCase() &&
          s.classCode === editClassCode
      );
      if (duplicateRoll) {
        editValidationFail(
          `Roll number "${editState.rollNumber.trim()}" is already assigned to "${duplicateRoll.name}" in class ${editClassCode}.`,
          "edit-field-rollNumber"
        );
        return;
      }
    }

    if (editStudentPassword || editStudentPasswordConfirm) {
      if (editStudentPassword !== editStudentPasswordConfirm) {
        setEditLoginError("Passwords do not match.");
        return;
      }
    }
    const updated: Student = {
      ...students.find((student) => student.id === editState.id)!,
      ...editState,
      classCode:
        editState.section === "N/A"
          ? editState.grade
          : `${editState.grade}${editState.section}`,
      studentPassword: editStudentPassword || "",
      history: [
        ...(students.find((student) => student.id === editState.id)?.history ?? []),
        "Student record updated",
      ],
    };
    setEditSaveStatus("saving");
    setEditSaveMessage(null);
    const saveResult = await onAddStudent(updated);
    if (saveResult.ok) {
      await syncHostelAllocation(
        updated.id,
        editState.hostelRequired,
        editState.hostelName.trim(),
        editState.hostelRoomNo.trim()
      );
      setListMessage("Student updated successfully.");
      setTimeout(() => setListMessage(null), 4000);
      setEditState(null);
    } else {
      showEditMessage(saveResult.error ?? "Unable to save changes. Please try again.", "error");
    }
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
        student.registerNo ?? "",
        student.rollNumber,
        student.address,
        student.session ?? "",
        student.fatherName ?? "",
        student.motherName ?? "",
        student.parentName,
        student.parentRelation,
        student.parentPhone,
        student.parentWhatsapp ?? "",
        student.parentEmail,
        student.parentOccupation,
        student.transportRequired ? "Yes" : "No",
        student.transportRoute ?? "",
        student.transportVehicleNo ?? "",
        student.transportStopName ?? "",
        student.hostelRequired ? "Yes" : "No",
        student.hostelName ?? "",
        student.hostelRoomNo ?? "",
        student.previousSchoolName ?? "",
        student.previousQualification ?? "",
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
      const importSection = hasClassLock ? derivedSection : record.section ?? "N/A";
      const importClassCode =
        importSection === "N/A" ? importGrade : `${importGrade}${importSection}`;
      const newStudent: Student = {
        id: (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`),
        name: record.name ?? "",
        grade: importGrade,
        section: importSection,
        classCode: importClassCode,
        gender: (record.gender as "Male" | "Female") ?? "Male",
        dateOfBirth: record.dateOfBirth ?? "",
        admissionNumber: record.admissionNumber ?? "",
        registerNo: record.registerNo ?? "",
        rollNumber: record.rollNumber ?? "",
        address: record.address ?? "",
        session: record.session ?? "",
        fatherName: record.fatherName ?? "",
        motherName: record.motherName ?? "",
        parentName: record.parentName ?? "",
        parentRelation: record.parentRelation ?? "Parent",
        parentPhone: record.parentPhone ?? "",
        parentWhatsapp: record.parentWhatsapp ?? "",
        parentEmail: record.parentEmail ?? "",
        parentOccupation: record.parentOccupation ?? "",
        transportRequired: record.transportRequired === "Yes",
        transportRoute: record.transportRoute ?? "",
        transportVehicleNo: record.transportVehicleNo ?? "",
        transportStopName: record.transportStopName ?? "",
        hostelRequired: record.hostelRequired === "Yes",
        hostelName: record.hostelName ?? "",
        hostelRoomNo: record.hostelRoomNo ?? "",
        previousSchoolName: record.previousSchoolName ?? "",
        previousQualification: record.previousQualification ?? "",
        status: record.status === "Inactive" ? "Inactive" : "Active",
        feeType: (record.feeType === "Free" ? "Free" : "Paid") as "Paid" | "Free",
        history: ["Imported from CSV"],
      };
      void onAddStudent(newStudent);
    });
    event.target.value = "";
  };

  const handleUpsertStudent = (student: Student) => {
    void onAddStudent(student);
  };

  const handleEditPhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !editState) return;
    setEditPhotoError(null);
    setEditPhotoUploading(true);
    try {
      const token = window.localStorage.getItem("authToken");
      const formData = new FormData();
      formData.append("file", file);
      const uploadRequest = await fetch(apiUrl("/api/students/photo-upload"), {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      });
      if (!uploadRequest.ok) {
        const err = await uploadRequest.json().catch(() => ({}));
        throw new Error(err?.error ?? "Unable to upload photo");
      }
      const { objectKey } = await uploadRequest.json();
      setEditState({ ...editState, profilePhotoKey: objectKey });
      setEditPhotoPreview(URL.createObjectURL(file));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setEditPhotoError(message);
    } finally {
      setEditPhotoUploading(false);
      event.target.value = "";
    }
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

      {isLoading ? (
        <div className={styles.loadingCard}>
          <div className={styles.skeletonTitle} />
          <div className={styles.skeletonLine} />
          <div className={styles.skeletonLine} />
          <div className={styles.skeletonLine} />
        </div>
      ) : activeTab === "Add Student" ? (
        <form className={styles.form} onSubmit={handleAddStudent}>
          <div className={styles.sectionTitle}>Student Details</div>
          <div className={styles.fieldRow}>
            <label className={styles.label} id="field-photo">
              Profile Photo <span className={styles.requiredMark}>*</span>
              <input
                className={styles.input}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                disabled={photoUploading}
              />
            </label>
            <div className={styles.profilePhotoPlaceholder}>
              {photoPreview ? (
                <img className={styles.profilePhoto} src={photoPreview} alt="Preview" />
              ) : (
                <span>No photo</span>
              )}
            </div>
          </div>
          {photoError ? <div className={styles.error}>{photoError}</div> : null}
          <div className={styles.fieldRow}>
            <label className={styles.label}>
              Student Name <span className={styles.requiredMark}>*</span>
              <input
                className={styles.input}
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </label>

            <label className={styles.label}>
              Gender <span className={styles.requiredMark}>*</span>
              <select
                className={styles.input}
                value={gender}
                onChange={(event) =>
                  setGender(event.target.value as "Male" | "Female")
                }
                required
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </label>

            <label className={styles.label} id="field-dob">
              Date of Birth <span className={styles.requiredMark}>*</span>
              <input
                className={styles.input}
                type="date"
                value={dateOfBirth}
                onChange={(event) => setDateOfBirth(event.target.value)}
                required
              />
            </label>

            <label className={styles.label}>
              Admission Number
              <input
                className={styles.input}
                type="text"
                value={admissionNumber || "Auto-generated"}
                onChange={(event) => setAdmissionNumber(event.target.value)}
                readOnly
              />
            </label>

            <label className={styles.label}>
              Register No <span className={styles.requiredMark}>*</span>
              <input
                className={styles.input}
                type="text"
                value={registerNo}
                onChange={(event) => setRegisterNo(event.target.value)}
                required
              />
            </label>

            <label className={styles.label} id="field-rollNumber">
              Roll Number <span className={styles.requiredMark}>*</span>
              <input
                className={styles.input}
                type="text"
                value={rollNumber}
                onChange={(event) => setRollNumber(event.target.value)}
                required
              />
            </label>

            <label className={styles.label}>
              Address <span className={styles.requiredMark}>*</span>
              <input
                className={styles.input}
                type="text"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                required
              />
            </label>
          </div>

          <div className={styles.sectionTitle}>Class Details</div>
          <div className={styles.fieldRow}>
            <label className={styles.label}>
              Grade <span className={styles.requiredMark}>*</span>
              <select
                className={styles.input}
                value={derivedGrade}
                onChange={(event) => {
                  setGrade(event.target.value);
                  setSection("");
                }}
                disabled={hasClassLock}
                required={!hasClassLock}
              >
                <option value="">Select</option>
                {gradeOptionsWithLock.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.label}>
              Section <span className={styles.requiredMark}>*</span>
              <select
                className={styles.input}
                value={
                  hasClassLock
                    ? displayLockedSection
                    : derivedSection || (sectionOptions.includes("N/A") ? "N/A" : "")
                }
                onChange={(event) => setSection(event.target.value)}
                disabled={hasClassLock || !derivedGrade}
                required={!hasClassLock}
              >
                <option value="">Select</option>
                {sectionOptionsWithLock.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.label}>
              Session <span className={styles.requiredMark}>*</span>
              <select
                className={styles.input}
                value={session}
                onChange={(event) => setSession(event.target.value)}
                disabled={!hasSelectedClass}
                onFocus={() => {
                  if (!hasSelectedClass) {
                    setSessionWarning("Select class first, then choose session.");
                  } else {
                    setSessionWarning(null);
                  }
                }}
                required
              >
                <option value="">Select</option>
                {sessionOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {sessionWarning ? (
            <div className={styles.notice}>{sessionWarning}</div>
          ) : null}

          <div className={styles.sectionTitle}>Parent/Guardian Details</div>
          <div className={styles.fieldRow}>
            <label className={styles.label}>
              <span className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={guardianExisting}
                  onChange={(event) => {
                    const checked = event.target.checked;
                    setGuardianExisting(checked);
                    if (!checked) {
                      setGuardianQuery("");
                      setGuardianResults([]);
                      setGuardianError(null);
                    }
                  }}
                />
                Guardian Already Exist
              </span>
            </label>
          </div>

          {guardianExisting ? (
            <div className={styles.fieldRow}>
              <label className={styles.label}>
                Search Guardian
                <input
                  className={styles.input}
                  type="search"
                  value={guardianQuery}
                  onChange={(event) => setGuardianQuery(event.target.value)}
                  placeholder="Search by name, phone, or email"
                />
              </label>
              <label className={styles.label}>
                Select Guardian
                <select
                  className={styles.input}
                  onChange={(event) => {
                    const selected = guardianResults.find(
                      (item) => item.id === event.target.value
                    );
                    if (!selected) return;
                    setParentName(selected.parentName ?? "");
                    setParentRelation(selected.parentRelation ?? "Parent");
                    setParentPhone(selected.parentPhone ?? "");
                    setParentWhatsapp(selected.parentWhatsapp ?? "");
                    setParentEmail(selected.parentEmail ?? "");
                    setParentOccupation(selected.parentOccupation ?? "");
                    setFatherName(selected.fatherName ?? "");
                    setMotherName(selected.motherName ?? "");
                    setWhatsappSame(
                      Boolean(
                        selected.parentPhone &&
                          selected.parentWhatsapp &&
                          selected.parentPhone === selected.parentWhatsapp
                      )
                    );
                  }}
                >
                  <option value="">Select</option>
                  {guardianResults.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.parentName} ({item.parentPhone || item.parentEmail})
                    </option>
                  ))}
                </select>
              </label>
              {guardianLoading ? (
                <div className={styles.loading}>Searching guardians...</div>
              ) : null}
              {guardianError ? (
                <div className={styles.error}>{guardianError}</div>
              ) : null}
            </div>
          ) : null}

          <div className={styles.fieldRow}>
          
            <label className={styles.label} id="field-fatherName">
              Father Name <span className={styles.requiredMark}>*</span>
              <input
                className={styles.input}
                type="text"
                value={fatherName}
                onChange={(event) => setFatherName(event.target.value)}
                required
              />
            </label>

            <label className={styles.label} id="field-motherName">
              Mother Name <span className={styles.requiredMark}>*</span>
              <input
                className={styles.input}
                type="text"
                value={motherName}
                onChange={(event) => setMotherName(event.target.value)}
                required
              />
            </label>

            <label className={styles.label}>
              Parent/Guardian Name <span className={styles.requiredMark}>*</span>
              <input
                className={styles.input}
                type="text"
                value={parentName}
                onChange={(event) => setParentName(event.target.value)}
                required
              />
            </label>

            <label className={styles.label}>
              Relation <span className={styles.requiredMark}>*</span>
              <select
                className={styles.input}
                value={parentRelation}
                onChange={(event) => setParentRelation(event.target.value)}
                required
              >
                {relationOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.label} id="field-phone">
              Mobile <span className={styles.requiredMark}>*</span>
              <input
                className={styles.input}
                type="tel"
                value={parentPhone}
                maxLength={10}
                onChange={(event) => {
                  const value = event.target.value.replace(/\D/g, "").slice(0, 10);
                  setParentPhone(value);
                  if (whatsappSame) {
                    setParentWhatsapp(value);
                  }
                }}
                required
              />
            </label>

            <label className={styles.label}>
              WhatsApp <span className={styles.requiredMark}>*</span>
              <input
                className={styles.input}
                type="tel"
                value={parentWhatsapp}
                maxLength={10}
                onChange={(event) => {
                  const value = event.target.value.replace(/\D/g, "").slice(0, 10);
                  setParentWhatsapp(value);
                }}
                required
              />
            </label>

            <label className={styles.label}>
              <span className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={whatsappSame}
                  onChange={(event) => {
                    const checked = event.target.checked;
                    setWhatsappSame(checked);
                    if (checked) {
                      setParentWhatsapp(parentPhone);
                    }
                  }}
                />
                WhatsApp same as mobile
              </span>
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
              Occupation <span className={styles.requiredMark}>*</span>
              <input
                className={styles.input}
                type="text"
                value={parentOccupation}
                onChange={(event) => setParentOccupation(event.target.value)}
                required
              />
            </label>
          </div>

          <div className={styles.sectionTitle}>Transport Details</div>
          <div className={styles.fieldRow}>
            <label className={styles.label}>
              <span className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={transportRequired}
                  onChange={(event) => {
                    const next = event.target.checked;
                    setTransportRequired(next);
                    if (!next) {
                      setTransportStopName("");
                    }
                  }}
                />
                Transport Required
              </span>
            </label>
          </div>
          {transportRequired ? (
            <div className={styles.fieldRow}>
              <label className={styles.label} id="field-transportStop">
                Transport Stop <span className={styles.requiredMark}>*</span>
                <select
                  className={styles.input}
                  value={transportStopName}
                  onChange={(event) => setTransportStopName(event.target.value)}
                  required
                >
                  <option value="">Select</option>
                  {transportStopOptions.map((stop) => (
                    <option key={stop} value={stop}>
                      {stop}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : null}

          <div className={styles.sectionTitle}>Hostel Details</div>
          <div className={styles.fieldRow}>
            <label className={styles.label}>
              <span className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={hostelRequired}
                  onChange={(event) => setHostelRequired(event.target.checked)}
                />
                Hostel Required
              </span>
            </label>
          </div>
          {hostelRequired ? (
            <div className={styles.fieldRow}>
              <label className={styles.label}>
                Hostel Name <span className={styles.requiredMark}>*</span>
                <select
                  className={styles.input}
                  value={hostelName}
                  onChange={(event) => setHostelName(event.target.value)}
                  required
                >
                  <option value="">Select</option>
                  {hostelOptions.map((hostel) => (
                    <option key={hostel} value={hostel}>
                      {hostel}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.label}>
                Room Number <span className={styles.requiredMark}>*</span>
                <select
                  className={styles.input}
                  value={hostelRoomNo}
                  onChange={(event) => setHostelRoomNo(event.target.value)}
                  required
                >
                  <option value="">Select</option>
                  {hostelRooms.map((room) => (
                    <option key={room} value={room}>
                      {room}
                    </option>
                  ))}
                </select>
              </label>
              {hostelSyncError ? (
                <div className={styles.error}>{hostelSyncError}</div>
              ) : null}
            </div>
          ) : null}

          <div className={styles.sectionTitle}>Previous School Details</div>
          <div className={styles.fieldRow}>
            <label className={styles.label}>
              Previous School Name
              <input
                className={styles.input}
                type="text"
                value={previousSchoolName}
                onChange={(event) => setPreviousSchoolName(event.target.value)}
              />
            </label>
            <label className={styles.label}>
              Qualification
              <input
                className={styles.input}
                type="text"
                value={previousQualification}
                onChange={(event) => setPreviousQualification(event.target.value)}
              />
            </label>
          </div>

          <div className={styles.sectionTitle}>Student Login</div>
          <div className={styles.fieldRow}>
            <label className={styles.label}>
              <span className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={enableStudentLogin}
                  onChange={(event) => {
                    const checked = event.target.checked;
                    setEnableStudentLogin(checked);
                    if (!checked) {
                      setStudentPassword("");
                      setStudentPasswordConfirm("");
                      setStudentLoginError(null);
                    }
                  }}
                />
                Enable Student Login (username = parent mobile)
              </span>
            </label>
          </div>
          {enableStudentLogin ? (
            <div className={styles.fieldRow}>
              <label className={styles.label}>
                Password <span className={styles.requiredMark}>*</span>
                <input
                  className={styles.input}
                  type="password"
                  value={studentPassword}
                  onChange={(event) => {
                    setStudentPassword(event.target.value);
                    setStudentLoginError(null);
                  }}
                  required
                />
              </label>
              <label className={styles.label}>
                Retype Password <span className={styles.requiredMark}>*</span>
                <input
                  className={styles.input}
                  type="password"
                  value={studentPasswordConfirm}
                  onChange={(event) => {
                    setStudentPasswordConfirm(event.target.value);
                    setStudentLoginError(null);
                  }}
                  required
                />
              </label>
            </div>
          ) : null}
          {studentLoginError ? (
            <div className={styles.error}>{studentLoginError}</div>
          ) : null}

          <button className={styles.button} type="submit">
            Add Student
          </button>

          {addValidationError ? (
            <div className={styles.error} id="add-validation-error">
              {addValidationError}
            </div>
          ) : null}

          {addSaveMessage ? (
            <div className={addSaveStatus === "error" ? styles.error : styles.saveMessage}>
              {addSaveMessage}
            </div>
          ) : null}
        </form>
      ) : (
        <div className={styles.listLayout}>
          {listMessage ? (
            <div className={styles.saveMessage}>{listMessage}</div>
          ) : null}
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
                  {resolvedClassOptions.map((item) => (
                    <option key={item.classCode} value={item.classCode}>
                      {item.classCode}
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
                    <th>Register #</th>
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
                      <td data-label="Register #">{student.registerNo || "-"}</td>
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
                    Profile Photo (Optional)
                    <input
                      className={styles.input}
                      type="file"
                      accept="image/*"
                      onChange={handleEditPhotoUpload}
                      disabled={editPhotoUploading}
                    />
                  </label>
                  <div className={styles.profilePhotoPlaceholder}>
                    {editPhotoLoading ? (
                      <div className={styles.photoSkeleton} />
                    ) : editPhotoPreview || editPhotoUrl ? (
                      <img
                        className={styles.profilePhoto}
                        src={editPhotoPreview ?? editPhotoUrl ?? ""}
                        alt="Preview"
                      />
                    ) : (
                      <span>No photo</span>
                    )}
                  </div>
                  {editPhotoError ? (
                    <div className={styles.error}>{editPhotoError}</div>
                  ) : null}
                  <label className={styles.label} id="edit-field-name">
                    Name <span className={styles.requiredMark}>*</span>
                    <input
                      className={styles.input}
                      value={editState.name}
                      onChange={(event) =>
                        setEditState({ ...editState, name: event.target.value })
                      }
                    />
                  </label>
                  <label className={styles.label}>
                    Grade <span className={styles.requiredMark}>*</span>
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
                    Section <span className={styles.requiredMark}>*</span>
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
                    Gender <span className={styles.requiredMark}>*</span>
                    <select
                      className={styles.input}
                      value={editState.gender}
                      onChange={(event) =>
                        setEditState({
                          ...editState,
                          gender: event.target.value as "Male" | "Female",
                        })
                      }
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </label>
                  <label className={styles.label} id="edit-field-dob">
                    Date of Birth <span className={styles.requiredMark}>*</span>
                    <input
                      className={styles.input}
                      type="date"
                      value={editState.dateOfBirth}
                      onChange={(event) =>
                        setEditState({ ...editState, dateOfBirth: event.target.value })
                      }
                    />
                  </label>
                  <label className={styles.label}>
                    Admission Number
                    <input
                      className={styles.input}
                      value={editState.admissionNumber}
                      onChange={(event) =>
                        setEditState({
                          ...editState,
                          admissionNumber: event.target.value,
                        })
                      }
                      readOnly
                    />
                  </label>
                  <label className={styles.label}>
                    Register No <span className={styles.requiredMark}>*</span>
                    <input
                      className={styles.input}
                      value={editState.registerNo}
                      onChange={(event) =>
                        setEditState({ ...editState, registerNo: event.target.value })
                      }
                    />
                  </label>
                  <label className={styles.label} id="edit-field-rollNumber">
                    Roll Number <span className={styles.requiredMark}>*</span>
                    <input
                      className={styles.input}
                      value={editState.rollNumber}
                      onChange={(event) =>
                        setEditState({ ...editState, rollNumber: event.target.value })
                      }
                    />
                  </label>
                  <label className={styles.label}>
                    Address <span className={styles.requiredMark}>*</span>
                    <input
                      className={styles.input}
                      value={editState.address}
                      onChange={(event) =>
                        setEditState({ ...editState, address: event.target.value })
                      }
                    />
                  </label>
                  <label className={styles.label}>
                    Status <span className={styles.requiredMark}>*</span>
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
                  <label className={styles.label}>
                    Session <span className={styles.requiredMark}>*</span>
                    <input
                      className={styles.input}
                      value={editState.session}
                      onChange={(event) =>
                        setEditState({ ...editState, session: event.target.value })
                      }
                    />
                  </label>
                  <label className={styles.label} id="edit-field-fatherName">
                    Father Name <span className={styles.requiredMark}>*</span>
                    <input
                      className={styles.input}
                      value={editState.fatherName}
                      onChange={(event) =>
                        setEditState({ ...editState, fatherName: event.target.value })
                      }
                    />
                  </label>
                  <label className={styles.label} id="edit-field-motherName">
                    Mother Name <span className={styles.requiredMark}>*</span>
                    <input
                      className={styles.input}
                      value={editState.motherName}
                      onChange={(event) =>
                        setEditState({ ...editState, motherName: event.target.value })
                      }
                    />
                  </label>
                  <label className={styles.label}>
                    Parent/Guardian Name <span className={styles.requiredMark}>*</span>
                    <input
                      className={styles.input}
                      value={editState.parentName}
                      onChange={(event) =>
                        setEditState({ ...editState, parentName: event.target.value })
                      }
                    />
                  </label>
                  <label className={styles.label}>
                    Relation <span className={styles.requiredMark}>*</span>
                    <select
                      className={styles.input}
                      value={editState.parentRelation}
                      onChange={(event) =>
                        setEditState({
                          ...editState,
                          parentRelation: event.target.value,
                        })
                      }
                    >
                      {relationOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={styles.label} id="edit-field-phone">
                    Mobile <span className={styles.requiredMark}>*</span>
                    <input
                      className={styles.input}
                      type="tel"
                      maxLength={10}
                      value={editState.parentPhone}
                      onChange={(event) =>
                        setEditState({ ...editState, parentPhone: event.target.value.replace(/\D/g, "").slice(0, 10) })
                      }
                    />
                  </label>
                  <label className={styles.label}>
                    WhatsApp <span className={styles.requiredMark}>*</span>
                    <input
                      className={styles.input}
                      type="tel"
                      maxLength={10}
                      value={editState.parentWhatsapp}
                      onChange={(event) =>
                        setEditState({ ...editState, parentWhatsapp: event.target.value.replace(/\D/g, "").slice(0, 10) })
                      }
                    />
                  </label>
                  <label className={styles.label}>
                    Email
                    <input
                      className={styles.input}
                      value={editState.parentEmail}
                      onChange={(event) =>
                        setEditState({
                          ...editState,
                          parentEmail: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label className={styles.label}>
                    Occupation <span className={styles.requiredMark}>*</span>
                    <input
                      className={styles.input}
                      value={editState.parentOccupation}
                      onChange={(event) =>
                        setEditState({
                          ...editState,
                          parentOccupation: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label className={styles.label}>
                    Transport Required
                    <select
                      className={styles.input}
                      value={editState.transportRequired ? "yes" : "no"}
                      onChange={(event) =>
                        setEditState({
                          ...editState,
                          transportRequired: event.target.value === "yes",
                          transportRoute:
                            event.target.value === "yes" ? editState.transportRoute : "",
                          transportVehicleNo:
                            event.target.value === "yes" ? editState.transportVehicleNo : "",
                          transportStopName:
                            event.target.value === "yes" ? editState.transportStopName : "",
                        })
                      }
                    >
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  </label>
                  {editState.transportRequired ? (
                    <label className={styles.label} id="edit-field-transportStop">
                      Transport Stop <span className={styles.requiredMark}>*</span>
                      <select
                        className={styles.input}
                        value={editState.transportStopName}
                        onChange={(event) =>
                          setEditState({
                            ...editState,
                            transportStopName: event.target.value,
                          })
                        }
                      >
                        <option value="">Select</option>
                        {editTransportStopOptions.map((stop) => (
                          <option key={stop} value={stop}>
                            {stop}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                  <label className={styles.label}>
                    Hostel Required
                    <select
                      className={styles.input}
                      value={editState.hostelRequired ? "yes" : "no"}
                      onChange={(event) =>
                        setEditState({
                          ...editState,
                          hostelRequired: event.target.value === "yes",
                        })
                      }
                    >
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  </label>
                  {editState.hostelRequired ? (
                    <>
                      <label className={styles.label}>
                        Hostel Name <span className={styles.requiredMark}>*</span>
                        <select
                          className={styles.input}
                          value={editState.hostelName}
                          onChange={(event) =>
                            setEditState({
                              ...editState,
                              hostelName: event.target.value,
                            })
                          }
                        >
                          <option value="">Select</option>
                          {hostelOptions.map((hostel) => (
                            <option key={hostel} value={hostel}>
                              {hostel}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className={styles.label}>
                        Room Number <span className={styles.requiredMark}>*</span>
                        <select
                          className={styles.input}
                          value={editState.hostelRoomNo}
                          onChange={(event) =>
                            setEditState({
                              ...editState,
                              hostelRoomNo: event.target.value,
                            })
                          }
                        >
                          <option value="">Select</option>
                          {hostelRooms.map((room) => (
                            <option key={room} value={room}>
                              {room}
                            </option>
                          ))}
                        </select>
                      </label>
                    </>
                  ) : null}
                  <label className={styles.label}>
                    Previous School
                    <input
                      className={styles.input}
                      value={editState.previousSchoolName}
                      onChange={(event) =>
                        setEditState({
                          ...editState,
                          previousSchoolName: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label className={styles.label}>
                    Qualification
                    <input
                      className={styles.input}
                      value={editState.previousQualification}
                      onChange={(event) =>
                        setEditState({
                          ...editState,
                          previousQualification: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label className={styles.label}>
                    Set Student Login Password
                    <input
                      className={styles.input}
                      type="password"
                      value={editStudentPassword}
                      onChange={(event) => {
                        setEditStudentPassword(event.target.value);
                        setEditLoginError(null);
                      }}
                      placeholder="Leave blank to keep unchanged"
                    />
                  </label>
                  <label className={styles.label}>
                    Retype Password
                    <input
                      className={styles.input}
                      type="password"
                      value={editStudentPasswordConfirm}
                      onChange={(event) => {
                        setEditStudentPasswordConfirm(event.target.value);
                        setEditLoginError(null);
                      }}
                      placeholder="Leave blank to keep unchanged"
                    />
                  </label>
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.button}
                type="button"
                onClick={handleSaveEdit}
                disabled={editSaveStatus === "saving"}
              >
                {editSaveStatus === "saving" ? "Saving..." : "Confirm & Save"}
              </button>
            </div>
            {editValidationError ? (
              <div className={styles.error} id="edit-validation-error">
                {editValidationError}
              </div>
            ) : null}
            {editLoginError ? <div className={styles.error}>{editLoginError}</div> : null}
            {editSaveMessage ? (
              <div className={editSaveStatus === "success" ? styles.saveMessage : styles.error}>
                {editSaveMessage}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
