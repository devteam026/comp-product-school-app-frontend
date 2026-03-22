"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "../styles/home.module.css";
import { apiUrl } from "../../lib/api";

type TeacherDetails = {
  subjectsAssigned: string;
  classesAssigned: string;
  periodAllocation: string;
  classTeacher: boolean;
};

type Employee = {
  id?: number;
  employeeId?: number;
  firstName: string;
  middleName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  profilePhotoKey?: string;
  maritalStatus: string;
  bloodGroup: string;
  nationality: string;
  mobileNumber: string;
  whatsappNumber: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pinCode: string;
  emergencyContactName: string;
  emergencyContactNumber: string;
  highestQualification: string;
  specialization: string;
  universityName: string;
  yearOfPassing?: number | null;
  experienceYears?: number | null;
  previousEmployer: string;
  certifications: string;
  department: string;
  designation: string;
  role: string;
  employmentType: string;
  dateOfJoining: string;
  probationPeriod: string;
  reportingManagerId?: number | null;
  workLocation: string;
  shiftTiming: string;
  aadhaarNumber: string;
  panNumber: string;
  passportNumber: string;
  drivingLicense: string;
  contractDocKey?: string;
  idProofKey?: string;
  resumeKey?: string;
  teacherDetails?: TeacherDetails;
};

type EmployeeManagementProps = {
  isLoading?: boolean;
};

const emptyTeacherDetails = (): TeacherDetails => ({
  subjectsAssigned: "",
  classesAssigned: "",
  periodAllocation: "",
  classTeacher: false,
});

const departmentOptions = ["Teaching", "Accounts", "Admin", "Transport"] as const;
const designationOptions = ["Teacher", "Accountant", "Clerk", "Driver"] as const;
const employmentTypeOptions = ["Full-time", "Part-time", "Contract"] as const;

const sanitizeDigits = (value: string, maxLen: number) =>
  value.replace(/\D/g, "").slice(0, maxLen);

const emptyEmployee = (): Employee => ({
  firstName: "",
  middleName: "",
  lastName: "",
  gender: "",
  dateOfBirth: "",
  profilePhotoKey: "",
  maritalStatus: "",
  bloodGroup: "",
  nationality: "",
  mobileNumber: "",
  whatsappNumber: "",
  email: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pinCode: "",
  emergencyContactName: "",
  emergencyContactNumber: "",
  highestQualification: "",
  specialization: "",
  universityName: "",
  yearOfPassing: null,
  experienceYears: null,
  previousEmployer: "",
  certifications: "",
  department: "",
  designation: "",
  role: "",
  employmentType: "",
  dateOfJoining: "",
  probationPeriod: "",
  reportingManagerId: null,
  workLocation: "",
  shiftTiming: "",
  aadhaarNumber: "",
  panNumber: "",
  passportNumber: "",
  drivingLicense: "",
  contractDocKey: "",
  idProofKey: "",
  resumeKey: "",
  teacherDetails: emptyTeacherDetails(),
});

export default function EmployeeManagement({ isLoading }: EmployeeManagementProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "Add Employee" | "List Employees" | "Role Setup"
  >("Add Employee");
  const [roleEmployeeId, setRoleEmployeeId] = useState<string>("");
  const [roleValue, setRoleValue] = useState("");
  const [rolePassword, setRolePassword] = useState("");
  const [rolePasswordConfirm, setRolePasswordConfirm] = useState("");
  const [roleDepartment, setRoleDepartment] = useState("");
  const [updatePassword, setUpdatePassword] = useState(true);
  const [roleActive, setRoleActive] = useState(true);
  const [roleMessage, setRoleMessage] = useState<string | null>(null);
  const [showClassModal, setShowClassModal] = useState(false);
  const [classOptions, setClassOptions] = useState<string[]>([]);
  const [classSelection, setClassSelection] = useState<string[]>([]);
  const [classMessage, setClassMessage] = useState<string | null>(null);
  const [isClassLoading, setIsClassLoading] = useState(false);
  const [form, setForm] = useState<Employee>(() => emptyEmployee());
  const [editState, setEditState] = useState<Employee | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<Record<string, string>>({});
  const [editUploadStatus, setEditUploadStatus] = useState<Record<string, string>>(
    {}
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [selectedFiles, setSelectedFiles] = useState<Record<string, string>>({});
  const [editSelectedFiles, setEditSelectedFiles] = useState<Record<string, string>>(
    {}
  );

  const isTeacher = (department: string) =>
    department.toLowerCase().includes("teaching");

  const teacherSectionVisible = isTeacher(
    (editState ?? form).department ?? ""
  );

  useEffect(() => {
    const load = async () => {
      setIsFetching(true);
      const token = window.localStorage.getItem("authToken");
      const response = await fetch(apiUrl("/api/employees"), {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (response.ok) {
        const data = (await response.json()) as Employee[];
        setEmployees(Array.isArray(data) ? data : []);
      }
      setIsFetching(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (!saveMessage) return;
    const timer = window.setTimeout(() => setSaveMessage(null), 2000);
    return () => window.clearTimeout(timer);
  }, [saveMessage]);

  useEffect(() => {
    if (!roleMessage) return;
    const timer = window.setTimeout(() => setRoleMessage(null), 2000);
    return () => window.clearTimeout(timer);
  }, [roleMessage]);

  useEffect(() => {
    if (!classMessage) return;
    const timer = window.setTimeout(() => setClassMessage(null), 2000);
    return () => window.clearTimeout(timer);
  }, [classMessage]);

  useEffect(() => {
    if (roleValue !== "teacher" || !roleEmployeeId) return;
    let isActive = true;
    setShowClassModal(true);
    setIsClassLoading(true);
    const token = window.localStorage.getItem("authToken");
    fetch(apiUrl("/api/classes"), {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: string[]) => {
        if (!isActive) return;
        setClassOptions(Array.isArray(data) ? data : []);
      })
      .finally(() => {
        if (isActive) {
          setClassSelection([]);
          setIsClassLoading(false);
        }
      });
    return () => {
      isActive = false;
    };
  }, [roleValue, roleEmployeeId]);
  const handleChange = (key: keyof Employee, value: string | number | boolean) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleTeacherChange = (key: keyof TeacherDetails, value: string | boolean) => {
    setForm((prev) => ({
      ...prev,
      teacherDetails: {
        ...(prev.teacherDetails ?? emptyTeacherDetails()),
        [key]: value,
      },
    }));
  };

  const handleEditChange = (key: keyof Employee, value: string | number | boolean) => {
    if (!editState) return;
    setEditState({ ...editState, [key]: value });
  };

  const handleEditTeacherChange = (
    key: keyof TeacherDetails,
    value: string | boolean
  ) => {
    if (!editState) return;
    setEditState({
      ...editState,
      teacherDetails: {
        ...(editState.teacherDetails ?? emptyTeacherDetails()),
        [key]: value,
      },
    });
  };

  const uploadFile = async (file: File, type: string) => {
    setUploadError(null);
    setIsUploading(true);
    try {
      const token = window.localStorage.getItem("authToken");
      const uploadRequest = await fetch(
        apiUrl(
          `/api/employees/upload?contentType=${encodeURIComponent(
            file.type
          )}&fileName=${encodeURIComponent(file.name)}&sizeBytes=${file.size}&type=${type}`
        ),
        {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }
      );
      if (!uploadRequest.ok) {
        throw new Error("Unable to start upload");
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
      return objectKey as string;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setUploadError(message);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handlePhotoSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedFiles((prev) => ({ ...prev, profile: file.name }));
    const objectKey = await uploadFile(file, "profile");
    if (objectKey) {
      setForm((prev) => ({ ...prev, profilePhotoKey: objectKey }));
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleEditPhotoSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !editState) return;
    setEditSelectedFiles((prev) => ({ ...prev, profile: file.name }));
    const objectKey = await uploadFile(file, "profile");
    if (objectKey) {
      setEditState({ ...editState, profilePhotoKey: objectKey });
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleDocUpload = async (type: "contract" | "idProof" | "resume") => {
    const input = document.createElement("input");
    input.type = "file";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      setSelectedFiles((prev) => ({ ...prev, [type]: file.name }));
      const objectKey = await uploadFile(file, type);
      if (!objectKey) return;
      setForm((prev) => ({
        ...prev,
        ...(type === "contract" ? { contractDocKey: objectKey } : {}),
        ...(type === "idProof" ? { idProofKey: objectKey } : {}),
        ...(type === "resume" ? { resumeKey: objectKey } : {}),
      }));
      setUploadStatus((prev) => ({
        ...prev,
        [type]: "Uploaded successfully.",
      }));
    };
    input.click();
  };

  const handleEditDocUpload = async (type: "contract" | "idProof" | "resume") => {
    const input = document.createElement("input");
    input.type = "file";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file || !editState) return;
      setEditSelectedFiles((prev) => ({ ...prev, [type]: file.name }));
      const objectKey = await uploadFile(file, type);
      if (!objectKey) return;
      setEditState({
        ...editState,
        ...(type === "contract" ? { contractDocKey: objectKey } : {}),
        ...(type === "idProof" ? { idProofKey: objectKey } : {}),
        ...(type === "resume" ? { resumeKey: objectKey } : {}),
      });
      setEditUploadStatus((prev) => ({
        ...prev,
        [type]: "Uploaded successfully.",
      }));
    };
    input.click();
  };

  const openFile = async (
    employeeId: number | undefined,
    type: "profile" | "contract" | "idProof" | "resume"
  ) => {
    if (!employeeId) return;
    const token = window.localStorage.getItem("authToken");
    const response = await fetch(
      apiUrl(`/api/employees/${employeeId}/file-url?type=${type}`),
      { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
    );
    if (!response.ok) return;
    const data = await response.json();
    if (data?.url) {
      window.open(data.url, "_blank", "noopener,noreferrer");
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors: Record<string, string> = {};
    const required: Array<[keyof Employee, string]> = [
      ["aadhaarNumber", "Aadhaar Number is required."],
      ["gender", "Gender is required."],
      ["dateOfBirth", "Date of Birth is required."],
      ["department", "Department is required."],
      ["designation", "Designation is required."],
      ["employmentType", "Employment Type is required."],
      ["dateOfJoining", "Date of Joining is required."],
      ["mobileNumber", "Mobile number is required."],
      ["whatsappNumber", "Whatsapp number is required."],
      ["addressLine1", "Address Line 1 is required."],
      ["emergencyContactName", "Emergency contact name is required."],
      ["emergencyContactNumber", "Emergency contact number is required."],
    ];
    required.forEach(([field, message]) => {
      const value = String(form[field] ?? "").trim();
      if (!value) errors[field as string] = message;
    });
    if (!form.idProofKey) {
      errors.idProofKey = "ID proof upload is required.";
    }
    if (form.mobileNumber && !/^\d{10}$/.test(form.mobileNumber)) {
      errors.mobileNumber = "Mobile number must be 10 digits.";
    }
    if (form.whatsappNumber && !/^\d{10}$/.test(form.whatsappNumber)) {
      errors.whatsappNumber = "Whatsapp number must be 10 digits.";
    }
    if (form.yearOfPassing && !/^\d{4}$/.test(String(form.yearOfPassing))) {
      errors.yearOfPassing = "Year of passing must be 4 digits.";
    }
    if (form.experienceYears != null && String(form.experienceYears).length > 2) {
      errors.experienceYears = "Experience must be 2 digits.";
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const token = window.localStorage.getItem("authToken");
      const response = await fetch(apiUrl("/api/employees"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(form),
      });
      if (!response.ok) {
        throw new Error("Unable to save employee");
      }
      const saved = (await response.json()) as Employee;
      setEmployees((prev) => [saved, ...prev]);
      setForm(emptyEmployee());
      setPhotoPreview(null);
      setSelectedFiles({});
      setSaveMessage("Employee added successfully.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Save failed";
      setSaveMessage(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!editState?.id) return;
    const errors: Record<string, string> = {};
    const required: Array<[keyof Employee, string]> = [
      ["aadhaarNumber", "Aadhaar Number is required."],
      ["gender", "Gender is required."],
      ["dateOfBirth", "Date of Birth is required."],
      ["department", "Department is required."],
      ["designation", "Designation is required."],
      ["employmentType", "Employment Type is required."],
      ["dateOfJoining", "Date of Joining is required."],
      ["mobileNumber", "Mobile number is required."],
      ["whatsappNumber", "Whatsapp number is required."],
      ["addressLine1", "Address Line 1 is required."],
      ["emergencyContactName", "Emergency contact name is required."],
      ["emergencyContactNumber", "Emergency contact number is required."],
    ];
    required.forEach(([field, message]) => {
      const value = String(editState[field] ?? "").trim();
      if (!value) errors[field as string] = message;
    });
    if (!editState.idProofKey) {
      errors.idProofKey = "ID proof upload is required.";
    }
    if (editState.mobileNumber && !/^\d{10}$/.test(editState.mobileNumber)) {
      errors.mobileNumber = "Mobile number must be 10 digits.";
    }
    if (editState.whatsappNumber && !/^\d{10}$/.test(editState.whatsappNumber)) {
      errors.whatsappNumber = "Whatsapp number must be 10 digits.";
    }
    if (editState.yearOfPassing && !/^\d{4}$/.test(String(editState.yearOfPassing))) {
      errors.yearOfPassing = "Year of passing must be 4 digits.";
    }
    if (
      editState.experienceYears != null &&
      String(editState.experienceYears).length > 2
    ) {
      errors.experienceYears = "Experience must be 2 digits.";
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const token = window.localStorage.getItem("authToken");
      const response = await fetch(apiUrl(`/api/employees/${editState.id}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(editState),
      });
      if (!response.ok) {
        throw new Error("Unable to update employee");
      }
      const updated = (await response.json()) as Employee;
      setEmployees((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
      setEditState(null);
      setSaveMessage("Employee updated successfully.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Update failed";
      setSaveMessage(message);
    } finally {
      setIsSaving(false);
    }
  };

  const startEdit = async (employee: Employee) => {
    setEditState(employee);
    setPhotoPreview(null);
    setPhotoUrl(null);
    setEditUploadStatus({});
    setEditSelectedFiles({});
    setFieldErrors({});
    if (employee.id) {
      const token = window.localStorage.getItem("authToken");
      const response = await fetch(
        apiUrl(`/api/employees/${employee.id}/file-url?type=profile`),
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
      );
      if (response.ok) {
        const data = await response.json();
        if (data?.url) setPhotoUrl(data.url);
      }
    }
  };

  const rows = useMemo(() => employees, [employees]);
  const roleOptions = ["admin", "teacher", "parent", "student", "accountant"];
  const filteredEmployees = roleDepartment
    ? employees.filter((employee) => employee.department === roleDepartment)
    : employees;

  return (
    <div className={styles.form}>
      <div className={styles.tabs}>
        {["Add Employee", "List Employees", "Role Setup"].map((tab) => (
          <button
            key={tab}
            type="button"
            className={`${styles.tab} ${tab === activeTab ? styles.tabActive : ""}`}
            onClick={() =>
              setActiveTab(tab as "Add Employee" | "List Employees" | "Role Setup")
            }
          >
            {tab}
          </button>
        ))}
      </div>

      {isLoading || isFetching ? (
        <div className={styles.loadingCard}>
          <div className={styles.skeletonTitle} />
          <div className={styles.skeletonLine} />
          <div className={styles.skeletonLine} />
        </div>
      ) : activeTab === "Add Employee" ? (
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.sectionTitle}>Basic Information</div>
          <div className={styles.fieldGrid}>
            <label className={styles.label}>
              First Name <span className={styles.requiredMark}>*</span>
              <input
                className={styles.input}
                value={form.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                required
              />
            </label>
            <label className={styles.label}>
              Middle Name
              <input
                className={styles.input}
                value={form.middleName}
                onChange={(e) => handleChange("middleName", e.target.value)}
              />
            </label>
            <label className={styles.label}>
              Last Name <span className={styles.requiredMark}>*</span>
              <input
                className={styles.input}
                value={form.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                required
              />
            </label>
            <label className={styles.label}>
              Gender <span className={styles.requiredMark}>*</span>
              <select
                className={styles.input}
                value={form.gender}
                onChange={(e) => handleChange("gender", e.target.value)}
                required
              >
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {fieldErrors.gender ? (
                <span className={styles.error}>{fieldErrors.gender}</span>
              ) : null}
            </label>
            <label className={styles.label}>
              Date of Birth <span className={styles.requiredMark}>*</span>
              <input
                className={styles.input}
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                required
              />
              {fieldErrors.dateOfBirth ? (
                <span className={styles.error}>{fieldErrors.dateOfBirth}</span>
              ) : null}
            </label>
            <label className={styles.label}>
              Profile Photo
              <input
                className={styles.input}
                type="file"
                accept="image/<span className={styles.requiredMark}>*</span>"
                onChange={handlePhotoSelect}
                disabled={isUploading}
              />
            </label>
            {selectedFiles.profile ? (
              <div className={styles.helperText}>{selectedFiles.profile}</div>
            ) : null}
            {photoPreview ? (
              <img className={styles.profilePhoto} src={photoPreview} alt="Preview" />
            ) : null}
          </div>

          <div className={styles.sectionTitle}>Contact Details</div>
          <div className={styles.fieldGrid}>
            <label className={styles.label}>
              Mobile Number <span className={styles.requiredMark}>*</span>
              <input
                className={styles.input}
                value={form.mobileNumber}
                onChange={(e) =>
                  handleChange("mobileNumber", sanitizeDigits(e.target.value, 10))
                }
                inputMode="numeric"
                maxLength={10}
                required
              />
              {fieldErrors.mobileNumber ? (
                <span className={styles.error}>{fieldErrors.mobileNumber}</span>
              ) : null}
            </label>
            <label className={styles.label}>
              Whatsapp Number <span className={styles.requiredMark}>*</span>
              <input
                className={styles.input}
                value={form.whatsappNumber}
                onChange={(e) =>
                  handleChange("whatsappNumber", sanitizeDigits(e.target.value, 10))
                }
                inputMode="numeric"
                maxLength={10}
                required
              />
              {fieldErrors.whatsappNumber ? (
                <span className={styles.error}>{fieldErrors.whatsappNumber}</span>
              ) : null}
            </label>
            <label className={styles.label}>
              Email ID
              <input
                className={styles.input}
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
              />
            </label>
            <label className={styles.label}>
              Address Line 1 <span className={styles.requiredMark}>*</span>
              <input
                className={styles.input}
                value={form.addressLine1}
                onChange={(e) => handleChange("addressLine1", e.target.value)}
                required
              />
              {fieldErrors.addressLine1 ? (
                <span className={styles.error}>{fieldErrors.addressLine1}</span>
              ) : null}
            </label>
            <label className={styles.label}>
              Address Line 2
              <input
                className={styles.input}
                value={form.addressLine2}
                onChange={(e) => handleChange("addressLine2", e.target.value)}
              />
            </label>
            <label className={styles.label}>
              City
              <input
                className={styles.input}
                value={form.city}
                onChange={(e) => handleChange("city", e.target.value)}
              />
            </label>
            <label className={styles.label}>
              State
              <input
                className={styles.input}
                value={form.state}
                onChange={(e) => handleChange("state", e.target.value)}
              />
            </label>
            <label className={styles.label}>
              PIN Code
              <input
                className={styles.input}
                value={form.pinCode}
                onChange={(e) => handleChange("pinCode", e.target.value)}
              />
            </label>
            <label className={styles.label}>
              Emergency Contact Name <span className={styles.requiredMark}>*</span>
              <input
                className={styles.input}
                value={form.emergencyContactName}
                onChange={(e) => handleChange("emergencyContactName", e.target.value)}
                required
              />
              {fieldErrors.emergencyContactName ? (
                <span className={styles.error}>
                  {fieldErrors.emergencyContactName}
                </span>
              ) : null}
            </label>
            <label className={styles.label}>
              Emergency Contact Number <span className={styles.requiredMark}>*</span>
              <input
                className={styles.input}
                value={form.emergencyContactNumber}
                onChange={(e) =>
                  handleChange("emergencyContactNumber", e.target.value)
                }
                required
              />
              {fieldErrors.emergencyContactNumber ? (
                <span className={styles.error}>
                  {fieldErrors.emergencyContactNumber}
                </span>
              ) : null}
            </label>
          </div>

          <div className={styles.sectionTitle}>Academic / Qualification Details</div>
          <div className={styles.fieldGrid}>
            <label className={styles.label}>
              Highest Qualification
              <input
                className={styles.input}
                value={form.highestQualification}
                onChange={(e) => handleChange("highestQualification", e.target.value)}
              />
            </label>
            <label className={styles.label}>
              Specialization
              <input
                className={styles.input}
                value={form.specialization}
                onChange={(e) => handleChange("specialization", e.target.value)}
              />
            </label>
            <label className={styles.label}>
              University Name
              <input
                className={styles.input}
                value={form.universityName}
                onChange={(e) => handleChange("universityName", e.target.value)}
              />
            </label>
            <label className={styles.label}>
              Year of Passing
              <input
                className={styles.input}
                value={form.yearOfPassing ?? ""}
                onChange={(e) =>
                  handleChange(
                    "yearOfPassing",
                    Number(sanitizeDigits(e.target.value, 4))
                  )
                }
                inputMode="numeric"
                maxLength={4}
              />
              {fieldErrors.yearOfPassing ? (
                <span className={styles.error}>{fieldErrors.yearOfPassing}</span>
              ) : null}
            </label>
            <label className={styles.label}>
              Experience (Years)
              <input
                className={styles.input}
                value={form.experienceYears ?? ""}
                onChange={(e) =>
                  handleChange(
                    "experienceYears",
                    Number(sanitizeDigits(e.target.value, 2))
                  )
                }
                inputMode="numeric"
                maxLength={2}
              />
              {fieldErrors.experienceYears ? (
                <span className={styles.error}>{fieldErrors.experienceYears}</span>
              ) : null}
            </label>
            <label className={styles.label}>
              Previous Employer
              <input
                className={styles.input}
                value={form.previousEmployer}
                onChange={(e) => handleChange("previousEmployer", e.target.value)}
              />
            </label>
            <label className={styles.label}>
              Certifications
              <input
                className={styles.input}
                value={form.certifications}
                onChange={(e) => handleChange("certifications", e.target.value)}
              />
            </label>
          </div>

          <div className={styles.sectionTitle}>Employment Details</div>
          <div className={styles.fieldGrid}>
            <label className={styles.label}>
              Department <span className={styles.requiredMark}>*</span>
              <select
                className={styles.input}
                value={form.department}
                onChange={(e) => handleChange("department", e.target.value)}
                required
              >
                <option value="">Select</option>
                {departmentOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {fieldErrors.department ? (
                <span className={styles.error}>{fieldErrors.department}</span>
              ) : null}
            </label>
            <label className={styles.label}>
              Designation <span className={styles.requiredMark}>*</span>
              <select
                className={styles.input}
                value={form.designation}
                onChange={(e) => handleChange("designation", e.target.value)}
                required
              >
                <option value="">Select</option>
                {designationOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {fieldErrors.designation ? (
                <span className={styles.error}>{fieldErrors.designation}</span>
              ) : null}
            </label>
            <label className={styles.label}>
              Employment Type <span className={styles.requiredMark}>*</span>
              <select
                className={styles.input}
                value={form.employmentType}
                onChange={(e) => handleChange("employmentType", e.target.value)}
                required
              >
                <option value="">Select</option>
                {employmentTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {fieldErrors.employmentType ? (
                <span className={styles.error}>{fieldErrors.employmentType}</span>
              ) : null}
            </label>
            <label className={styles.label}>
              Date of Joining <span className={styles.requiredMark}>*</span>
              <input
                className={styles.input}
                type="date"
                value={form.dateOfJoining}
                onChange={(e) => handleChange("dateOfJoining", e.target.value)}
                required
              />
              {fieldErrors.dateOfJoining ? (
                <span className={styles.error}>{fieldErrors.dateOfJoining}</span>
              ) : null}
            </label>
            <label className={styles.label}>
              Probation Period
              <input
                className={styles.input}
                value={form.probationPeriod}
                onChange={(e) => handleChange("probationPeriod", e.target.value)}
              />
            </label>
            <label className={styles.label}>
              Work Location / Branch
              <input
                className={styles.input}
                value={form.workLocation}
                onChange={(e) => handleChange("workLocation", e.target.value)}
              />
            </label>
            <label className={styles.label}>
              Shift Timing
              <input
                className={styles.input}
                value={form.shiftTiming}
                onChange={(e) => handleChange("shiftTiming", e.target.value)}
              />
            </label>
          </div>

          <div className={styles.sectionTitle}>Legal & Compliance</div>
          <div className={styles.fieldGrid}>
            <label className={styles.label}>
              Aadhaar Number <span className={styles.requiredMark}>*</span>
              <input
                className={styles.input}
                value={form.aadhaarNumber}
                onChange={(e) => handleChange("aadhaarNumber", e.target.value)}
                required
              />
              {fieldErrors.aadhaarNumber ? (
                <span className={styles.error}>{fieldErrors.aadhaarNumber}</span>
              ) : null}
            </label>
            <label className={styles.label}>
              PAN Number
              <input
                className={styles.input}
                value={form.panNumber}
                onChange={(e) => handleChange("panNumber", e.target.value)}
              />
            </label>
            <label className={styles.label}>
              Passport Number
              <input
                className={styles.input}
                value={form.passportNumber}
                onChange={(e) => handleChange("passportNumber", e.target.value)}
              />
            </label>
            <label className={styles.label}>
              Driving License
              <input
                className={styles.input}
                value={form.drivingLicense}
                onChange={(e) => handleChange("drivingLicense", e.target.value)}
              />
            </label>
          </div>

          <div className={styles.sectionTitle}>Uploads</div>
          <div className={styles.fieldGrid}>
            <button
              className={styles.uploadButton}
              type="button"
              onClick={() => handleDocUpload("contract")}
            >
              Upload Contract
            </button>
            {selectedFiles.contract ? (
              <div className={styles.helperText}>{selectedFiles.contract}</div>
            ) : null}
            <button
              className={styles.uploadButton}
              type="button"
              onClick={() => handleDocUpload("idProof")}
            >
              Upload ID Proof *
            </button>
            {selectedFiles.idProof ? (
              <div className={styles.helperText}>{selectedFiles.idProof}</div>
            ) : null}
            {fieldErrors.idProofKey ? (
              <div className={styles.error}>{fieldErrors.idProofKey}</div>
            ) : null}
            <button
              className={styles.uploadButton}
              type="button"
              onClick={() => handleDocUpload("resume")}
            >
              Upload Resume
            </button>
            {selectedFiles.resume ? (
              <div className={styles.helperText}>{selectedFiles.resume}</div>
            ) : null}
            {uploadStatus.contract ? (
              <div className={styles.success}>{uploadStatus.contract}</div>
            ) : null}
            {uploadStatus.idProof ? (
              <div className={styles.success}>{uploadStatus.idProof}</div>
            ) : null}
            {uploadStatus.resume ? (
              <div className={styles.success}>{uploadStatus.resume}</div>
            ) : null}
            <div className={styles.helperText}>
              View links are available after the employee is saved.
            </div>
            {uploadError ? <div className={styles.error}>{uploadError}</div> : null}
          </div>

          {teacherSectionVisible ? (
            <>
              <div className={styles.sectionTitle}>Teacher Details</div>
              <div className={styles.fieldGrid}>
                <label className={styles.label}>
                  Subjects Assigned
                  <input
                    className={styles.input}
                    value={form.teacherDetails?.subjectsAssigned ?? ""}
                    onChange={(e) =>
                      handleTeacherChange("subjectsAssigned", e.target.value)
                    }
                  />
                </label>
                <label className={styles.label}>
                  Classes Assigned
                  <input
                    className={styles.input}
                    value={form.teacherDetails?.classesAssigned ?? ""}
                    onChange={(e) =>
                      handleTeacherChange("classesAssigned", e.target.value)
                    }
                  />
                </label>
                <label className={styles.label}>
                  Period Allocation
                  <input
                    className={styles.input}
                    value={form.teacherDetails?.periodAllocation ?? ""}
                    onChange={(e) =>
                      handleTeacherChange("periodAllocation", e.target.value)
                    }
                  />
                </label>
                <label className={styles.label}>
                  Class Teacher
                  <select
                    className={styles.input}
                    value={form.teacherDetails?.classTeacher ? "yes" : "no"}
                    onChange={(e) =>
                      handleTeacherChange("classTeacher", e.target.value === "yes")
                    }
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </label>
              </div>
            </>
          ) : null}

          <div className={styles.formActions}>
            <button className={styles.button} type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Add Employee"}
            </button>
            {saveMessage ? (
              <div className={styles.success}>{saveMessage}</div>
            ) : null}
          </div>
        </form>
      ) : activeTab === "List Employees" ? (
        <div className={styles.tableResponsive}>
          {rows.length === 0 ? (
            <div className={styles.empty}>No employees added yet.</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Mobile</th>
                  <th>Email</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((employee) => (
                  <tr key={employee.id}>
                    <td>{employee.employeeId ?? employee.id}</td>
                    <td>
                      {employee.firstName} {employee.lastName}
                    </td>
                    <td>{employee.department}</td>
                    <td>{employee.designation}</td>
                    <td>{employee.mobileNumber}</td>
                    <td>{employee.email}</td>
                    <td>
                      <button
                        className={styles.inlineButton}
                        type="button"
                        onClick={() => startEdit(employee)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className={styles.form}>
          <div className={styles.sectionTitle}>Role Setup</div>
          <div className={styles.fieldGrid}>
            <label className={styles.label}>
              Department
              <select
                className={styles.input}
                value={roleDepartment}
                onChange={(e) => {
                  setRoleDepartment(e.target.value);
                  setRoleEmployeeId("");
                }}
              >
                <option value="">Select</option>
                {departmentOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.label}>
              Employee (Username = Employee ID)
              <select
                className={styles.input}
                value={roleEmployeeId}
                onChange={(e) => setRoleEmployeeId(e.target.value)}
              >
                <option value="">Select</option>
                {filteredEmployees.map((employee) => (
                  <option key={employee.id} value={employee.id ?? ""}>
                    {employee.employeeId ?? employee.id} - {employee.firstName}{" "}
                    {employee.lastName}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.label}>
              Role
              <select
                className={styles.input}
                value={roleValue}
                onChange={(e) => setRoleValue(e.target.value)}
              >
                <option value="">Select</option>
                {roleOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.label}>
              Password
              <input
                className={styles.input}
                type="password"
                value={rolePassword}
                onChange={(e) => setRolePassword(e.target.value)}
                disabled={!updatePassword}
              />
            </label>
            <label className={styles.label}>
              Retype Password
              <input
                className={styles.input}
                type="password"
                value={rolePasswordConfirm}
                onChange={(e) => setRolePasswordConfirm(e.target.value)}
                disabled={!updatePassword}
              />
            </label>
            <label className={styles.label}>
              Update Password
              <select
                className={styles.input}
                value={updatePassword ? "yes" : "no"}
                onChange={(e) => setUpdatePassword(e.target.value === "yes")}
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </label>
            <label className={styles.label}>
              Status
              <select
                className={styles.input}
                value={roleActive ? "active" : "inactive"}
                onChange={(e) => setRoleActive(e.target.value === "active")}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
          </div>
          <div className={styles.formActions}>
            <button
              className={styles.button}
              type="button"
              onClick={async () => {
                if (!roleEmployeeId || !roleValue) {
                  setRoleMessage("Select employee and role.");
                  return;
                }
                if (updatePassword) {
                  if (!rolePassword || !rolePasswordConfirm) {
                    setRoleMessage("Enter and confirm password.");
                    return;
                  }
                  if (rolePassword !== rolePasswordConfirm) {
                    setRoleMessage("Passwords do not match.");
                    return;
                  }
                }
                const token = window.localStorage.getItem("authToken");
                const response = await fetch(
                  apiUrl(`/api/employees/${roleEmployeeId}/role`),
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify({
                      role: roleValue,
                      password: updatePassword ? rolePassword : "",
                      updatePassword,
                      active: roleActive,
                    }),
                  }
                );
                if (response.ok) {
                  setRolePassword("");
                  setRolePasswordConfirm("");
                  setRoleMessage("Login role assigned successfully.");
                } else {
                  setRoleMessage("Failed to assign login role.");
                }
              }}
            >
              Assign Role
            </button>
            {roleMessage ? (
              <div className={styles.success}>{roleMessage}</div>
            ) : null}
          </div>
          <div className={styles.sectionTitle}>Assigned Roles</div>
          <div className={styles.tableResponsive}>
            {employees.length === 0 ? (
              <div className={styles.empty}>No roles assigned yet.</div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Employee ID</th>
                    <th>Name</th>
                    <th>Department</th>
                    <th>Role</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <tr key={`role-${employee.id}`}>
                      <td>{employee.employeeId ?? employee.id}</td>
                      <td>
                        {employee.firstName} {employee.lastName}
                      </td>
                      <td>{employee.department || "-"}</td>
                      <td>{employee.role || "-"}</td>
                      <td>{employee.role ? "Active" : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {showClassModal ? (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <div>
                <h3>Select Classes</h3>
                <p className={styles.modalSubtitle}>
                  Assign one or more classes to this teacher.
                </p>
              </div>
              <button
                className={styles.inlineButton}
                type="button"
                onClick={() => setShowClassModal(false)}
              >
                Close
              </button>
            </div>
            <div className={styles.modalBody}>
              {isClassLoading ? (
                <div className={styles.loadingCard}>
                  <div className={styles.skeletonTitle} />
                  <div className={styles.skeletonLine} />
                  <div className={styles.skeletonLine} />
                </div>
              ) : classOptions.length === 0 ? (
                <div className={styles.empty}>No classes available.</div>
              ) : (
                <div className={styles.profileGrid}>
                  {classOptions.map((code) => (
                    <label key={code} className={styles.label}>
                      <input
                        type="checkbox"
                        checked={classSelection.includes(code)}
                        onChange={(e) => {
                          setClassSelection((prev) =>
                            e.target.checked
                              ? [...prev, code]
                              : prev.filter((item) => item !== code)
                          );
                        }}
                      />
                      <span>{code}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.button}
                type="button"
                onClick={async () => {
                  if (!roleEmployeeId) {
                    setClassMessage("Select a teacher first.");
                    return;
                  }
                  const token = window.localStorage.getItem("authToken");
                  const response = await fetch(
                    apiUrl(`/api/employees/${roleEmployeeId}/classes`),
                    {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                      },
                      body: JSON.stringify({ classCodes: classSelection }),
                    }
                  );
                  if (response.ok) {
                    setClassMessage("Classes assigned successfully.");
                    setShowClassModal(false);
                  } else {
                    let message = "Failed to assign classes.";
                    try {
                      const data = await response.json();
                      if (data?.message) message = data.message;
                    } catch {
                      // ignore parse errors
                    }
                    setClassMessage(message);
                  }
                }}
              >
                Save Classes
              </button>
              {classMessage ? (
                <div className={styles.success}>{classMessage}</div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {editState ? (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <div>
                <h3>Edit Employee</h3>
                <p className={styles.modalSubtitle}>
                  Update employee details and documents.
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
                <div className={styles.sectionTitle}>Basic Information</div>
                <div className={styles.profileGrid}>
                  <label className={styles.label}>
                    First Name <span className={styles.requiredMark}>*</span>
                    <input
                      className={styles.input}
                      value={editState.firstName}
                      onChange={(e) => handleEditChange("firstName", e.target.value)}
                    />
                  </label>
                  <label className={styles.label}>
                    Middle Name
                    <input
                      className={styles.input}
                      value={editState.middleName}
                      onChange={(e) => handleEditChange("middleName", e.target.value)}
                    />
                  </label>
                  <label className={styles.label}>
                    Last Name <span className={styles.requiredMark}>*</span>
                    <input
                      className={styles.input}
                      value={editState.lastName}
                      onChange={(e) => handleEditChange("lastName", e.target.value)}
                    />
                  </label>
                  <label className={styles.label}>
                    Gender <span className={styles.requiredMark}>*</span>
                    <select
                      className={styles.input}
                      value={editState.gender}
                      onChange={(e) => handleEditChange("gender", e.target.value)}
                      required
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    {fieldErrors.gender ? (
                      <span className={styles.error}>{fieldErrors.gender}</span>
                    ) : null}
                  </label>
                  <label className={styles.label}>
                    Date of Birth <span className={styles.requiredMark}>*</span>
                    <input
                      className={styles.input}
                      type="date"
                      value={editState.dateOfBirth}
                      onChange={(e) => handleEditChange("dateOfBirth", e.target.value)}
                      required
                    />
                    {fieldErrors.dateOfBirth ? (
                      <span className={styles.error}>{fieldErrors.dateOfBirth}</span>
                    ) : null}
                  </label>
                  <label className={styles.label}>
                    Profile Photo
                    <input
                      className={styles.input}
                      type="file"
                      accept="image/<span className={styles.requiredMark}>*</span>"
                      onChange={handleEditPhotoSelect}
                      disabled={isUploading}
                    />
                  </label>
                  {editSelectedFiles.profile ? (
                    <div className={styles.helperText}>
                      {editSelectedFiles.profile}
                    </div>
                  ) : null}
                  <div className={styles.profilePhotoPlaceholder}>
                    {photoPreview ? (
                      <img className={styles.profilePhoto} src={photoPreview} alt="Preview" />
                    ) : photoUrl ? (
                      <img className={styles.profilePhoto} src={photoUrl} alt="Profile" />
                    ) : (
                      <span>No photo</span>
                    )}
                  </div>
                </div>
              </div>
              <div className={styles.profileSection}>
                <div className={styles.sectionTitle}>Contact Details</div>
                <div className={styles.profileGrid}>
                  <label className={styles.label}>
                    Mobile <span className={styles.requiredMark}>*</span>
                    <input
                      className={styles.input}
                      value={editState.mobileNumber}
                      onChange={(e) =>
                        handleEditChange(
                          "mobileNumber",
                          sanitizeDigits(e.target.value, 10)
                        )
                      }
                      inputMode="numeric"
                      maxLength={10}
                      required
                    />
              {fieldErrors.mobileNumber ? (
                <span className={styles.error}>{fieldErrors.mobileNumber}</span>
              ) : null}
            </label>
                  <label className={styles.label}>
                    Whatsapp <span className={styles.requiredMark}>*</span>
                    <input
                      className={styles.input}
                      value={editState.whatsappNumber}
                      onChange={(e) =>
                        handleEditChange(
                          "whatsappNumber",
                          sanitizeDigits(e.target.value, 10)
                        )
                      }
                      inputMode="numeric"
                      maxLength={10}
                      required
                    />
              {fieldErrors.whatsappNumber ? (
                <span className={styles.error}>{fieldErrors.whatsappNumber}</span>
              ) : null}
            </label>
                  <label className={styles.label}>
                    Email
                    <input
                      className={styles.input}
                      value={editState.email}
                      onChange={(e) => handleEditChange("email", e.target.value)}
                    />
                  </label>
                  <label className={styles.label}>
                    Address Line 1 <span className={styles.requiredMark}>*</span>
                    <input
                      className={styles.input}
                      value={editState.addressLine1}
                      onChange={(e) =>
                        handleEditChange("addressLine1", e.target.value)
                      }
                      required
                    />
                    {fieldErrors.addressLine1 ? (
                      <span className={styles.error}>{fieldErrors.addressLine1}</span>
                    ) : null}
                  </label>
                  <label className={styles.label}>
                    Address Line 2
                    <input
                      className={styles.input}
                      value={editState.addressLine2}
                      onChange={(e) =>
                        handleEditChange("addressLine2", e.target.value)
                      }
                    />
                  </label>
                  <label className={styles.label}>
                    City
                    <input
                      className={styles.input}
                      value={editState.city}
                      onChange={(e) => handleEditChange("city", e.target.value)}
                    />
                  </label>
                  <label className={styles.label}>
                    State
                    <input
                      className={styles.input}
                      value={editState.state}
                      onChange={(e) => handleEditChange("state", e.target.value)}
                    />
                  </label>
                  <label className={styles.label}>
                    PIN Code
                    <input
                      className={styles.input}
                      value={editState.pinCode}
                      onChange={(e) => handleEditChange("pinCode", e.target.value)}
                    />
                  </label>
                  <label className={styles.label}>
                    Emergency Contact Name <span className={styles.requiredMark}>*</span>
                    <input
                      className={styles.input}
                      value={editState.emergencyContactName}
                      onChange={(e) =>
                        handleEditChange("emergencyContactName", e.target.value)
                      }
                      required
                    />
                    {fieldErrors.emergencyContactName ? (
                      <span className={styles.error}>
                        {fieldErrors.emergencyContactName}
                      </span>
                    ) : null}
                  </label>
                  <label className={styles.label}>
                    Emergency Contact Number <span className={styles.requiredMark}>*</span>
                    <input
                      className={styles.input}
                      value={editState.emergencyContactNumber}
                      onChange={(e) =>
                        handleEditChange(
                          "emergencyContactNumber",
                          e.target.value
                        )
                      }
                      required
                    />
                    {fieldErrors.emergencyContactNumber ? (
                      <span className={styles.error}>
                        {fieldErrors.emergencyContactNumber}
                      </span>
                    ) : null}
                  </label>
                </div>
              </div>
              <div className={styles.profileSection}>
                <div className={styles.sectionTitle}>Academic / Qualification Details</div>
                <div className={styles.profileGrid}>
                  <label className={styles.label}>
                    Highest Qualification
                    <input
                      className={styles.input}
                      value={editState.highestQualification}
                      onChange={(e) =>
                        handleEditChange("highestQualification", e.target.value)
                      }
                    />
                  </label>
                  <label className={styles.label}>
                    Specialization
                    <input
                      className={styles.input}
                      value={editState.specialization}
                      onChange={(e) =>
                        handleEditChange("specialization", e.target.value)
                      }
                    />
                  </label>
                  <label className={styles.label}>
                    University Name
                    <input
                      className={styles.input}
                      value={editState.universityName}
                      onChange={(e) =>
                        handleEditChange("universityName", e.target.value)
                      }
                    />
                  </label>
                  <label className={styles.label}>
                    Year of Passing
                    <input
                      className={styles.input}
                      value={editState.yearOfPassing ?? ""}
                      onChange={(e) =>
                        handleEditChange(
                          "yearOfPassing",
                          Number(sanitizeDigits(e.target.value, 4))
                        )
                      }
                      inputMode="numeric"
                      maxLength={4}
                    />
              {fieldErrors.yearOfPassing ? (
                <span className={styles.error}>{fieldErrors.yearOfPassing}</span>
              ) : null}
            </label>
                  <label className={styles.label}>
                    Experience (Years)
                    <input
                      className={styles.input}
                      value={editState.experienceYears ?? ""}
                      onChange={(e) =>
                        handleEditChange(
                          "experienceYears",
                          Number(sanitizeDigits(e.target.value, 2))
                        )
                      }
                      inputMode="numeric"
                      maxLength={2}
                    />
              {fieldErrors.experienceYears ? (
                <span className={styles.error}>{fieldErrors.experienceYears}</span>
              ) : null}
            </label>
                  <label className={styles.label}>
                    Previous Employer
                    <input
                      className={styles.input}
                      value={editState.previousEmployer}
                      onChange={(e) =>
                        handleEditChange("previousEmployer", e.target.value)
                      }
                    />
                  </label>
                </div>
              </div>
              <div className={styles.profileSection}>
                <div className={styles.sectionTitle}>Employment Details</div>
                <div className={styles.profileGrid}>
                  <label className={styles.label}>
                    Department <span className={styles.requiredMark}>*</span>
                    <select
                      className={styles.input}
                      value={editState.department}
                      onChange={(e) =>
                        handleEditChange("department", e.target.value)
                      }
                      required
                    >
                      <option value="">Select</option>
                      {departmentOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.department ? (
                      <span className={styles.error}>{fieldErrors.department}</span>
                    ) : null}
                  </label>
                  <label className={styles.label}>
                    Designation <span className={styles.requiredMark}>*</span>
                    <select
                      className={styles.input}
                      value={editState.designation}
                      onChange={(e) =>
                        handleEditChange("designation", e.target.value)
                      }
                      required
                    >
                      <option value="">Select</option>
                      {designationOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.designation ? (
                      <span className={styles.error}>{fieldErrors.designation}</span>
                    ) : null}
                  </label>
                  <label className={styles.label}>
                    Employment Type <span className={styles.requiredMark}>*</span>
                    <select
                      className={styles.input}
                      value={editState.employmentType}
                      onChange={(e) =>
                        handleEditChange("employmentType", e.target.value)
                      }
                      required
                    >
                      <option value="">Select</option>
                      {employmentTypeOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.employmentType ? (
                      <span className={styles.error}>
                        {fieldErrors.employmentType}
                      </span>
                    ) : null}
                  </label>
                  <label className={styles.label}>
                    Date of Joining <span className={styles.requiredMark}>*</span>
                    <input
                      className={styles.input}
                      type="date"
                      value={editState.dateOfJoining}
                      onChange={(e) =>
                        handleEditChange("dateOfJoining", e.target.value)
                      }
                      required
                    />
                    {fieldErrors.dateOfJoining ? (
                      <span className={styles.error}>{fieldErrors.dateOfJoining}</span>
                    ) : null}
                  </label>
                  <label className={styles.label}>
                    Probation Period
                    <input
                      className={styles.input}
                      value={editState.probationPeriod}
                      onChange={(e) =>
                        handleEditChange("probationPeriod", e.target.value)
                      }
                    />
                  </label>
                </div>
              </div>
              <div className={styles.profileSection}>
                <div className={styles.sectionTitle}>Legal & Compliance</div>
                <div className={styles.profileGrid}>
                  <label className={styles.label}>
                    Aadhaar Number <span className={styles.requiredMark}>*</span>
                    <input
                      className={styles.input}
                      value={editState.aadhaarNumber}
                      onChange={(e) =>
                        handleEditChange("aadhaarNumber", e.target.value)
                      }
                      required
                    />
                    {fieldErrors.aadhaarNumber ? (
                      <span className={styles.error}>{fieldErrors.aadhaarNumber}</span>
                    ) : null}
                  </label>
                  <label className={styles.label}>
                    PAN Number
                    <input
                      className={styles.input}
                      value={editState.panNumber}
                      onChange={(e) =>
                        handleEditChange("panNumber", e.target.value)
                      }
                    />
                  </label>
                  <label className={styles.label}>
                    Passport Number
                    <input
                      className={styles.input}
                      value={editState.passportNumber}
                      onChange={(e) =>
                        handleEditChange("passportNumber", e.target.value)
                      }
                    />
                  </label>
                  <label className={styles.label}>
                    Driving License
                    <input
                      className={styles.input}
                      value={editState.drivingLicense}
                      onChange={(e) =>
                        handleEditChange("drivingLicense", e.target.value)
                      }
                    />
                  </label>
                </div>
              </div>
              <div className={styles.profileSection}>
                <div className={styles.sectionTitle}>Uploads</div>
                <div className={styles.profileGrid}>
                  <button
                    className={styles.uploadButton}
                    type="button"
                    onClick={() => handleEditDocUpload("contract")}
                  >
                    Upload Contract
                  </button>
                  {editSelectedFiles.contract ? (
                    <div className={styles.helperText}>
                      {editSelectedFiles.contract}
                    </div>
                  ) : null}
                  <button
                    className={styles.inlineButton}
                    type="button"
                    onClick={() => openFile(editState.id, "contract")}
                    disabled={!editState.contractDocKey}
                  >
                    View Contract
                  </button>
                  <button
                    className={styles.uploadButton}
                    type="button"
                    onClick={() => handleEditDocUpload("idProof")}
                  >
                    Upload ID Proof *
                  </button>
                  {fieldErrors.idProofKey ? (
                    <div className={styles.error}>{fieldErrors.idProofKey}</div>
                  ) : null}
                  {editSelectedFiles.idProof ? (
                    <div className={styles.helperText}>
                      {editSelectedFiles.idProof}
                    </div>
                  ) : null}
                  <button
                    className={styles.inlineButton}
                    type="button"
                    onClick={() => openFile(editState.id, "idProof")}
                    disabled={!editState.idProofKey}
                  >
                    View ID Proof
                  </button>
                  <button
                    className={styles.uploadButton}
                    type="button"
                    onClick={() => handleEditDocUpload("resume")}
                  >
                    Upload Resume
                  </button>
                  {editSelectedFiles.resume ? (
                    <div className={styles.helperText}>
                      {editSelectedFiles.resume}
                    </div>
                  ) : null}
                  <button
                    className={styles.inlineButton}
                    type="button"
                    onClick={() => openFile(editState.id, "resume")}
                    disabled={!editState.resumeKey}
                  >
                    View Resume
                  </button>
                  {editUploadStatus.contract ? (
                    <div className={styles.success}>{editUploadStatus.contract}</div>
                  ) : null}
                  {editUploadStatus.idProof ? (
                    <div className={styles.success}>{editUploadStatus.idProof}</div>
                  ) : null}
                  {editUploadStatus.resume ? (
                    <div className={styles.success}>{editUploadStatus.resume}</div>
                  ) : null}
                </div>
              </div>
              {teacherSectionVisible ? (
                <div className={styles.profileSection}>
                  <div className={styles.sectionTitle}>Teacher Details</div>
                  <div className={styles.profileGrid}>
                    <label className={styles.label}>
                      Subjects Assigned
                      <input
                        className={styles.input}
                        value={editState.teacherDetails?.subjectsAssigned ?? ""}
                        onChange={(e) =>
                          handleEditTeacherChange(
                            "subjectsAssigned",
                            e.target.value
                          )
                        }
                      />
                    </label>
                    <label className={styles.label}>
                      Classes Assigned
                      <input
                        className={styles.input}
                        value={editState.teacherDetails?.classesAssigned ?? ""}
                        onChange={(e) =>
                          handleEditTeacherChange(
                            "classesAssigned",
                            e.target.value
                          )
                        }
                      />
                    </label>
                    <label className={styles.label}>
                      Period Allocation
                      <input
                        className={styles.input}
                        value={editState.teacherDetails?.periodAllocation ?? ""}
                        onChange={(e) =>
                          handleEditTeacherChange(
                            "periodAllocation",
                            e.target.value
                          )
                        }
                      />
                    </label>
                    <label className={styles.label}>
                      Class Teacher
                      <select
                        className={styles.input}
                        value={editState.teacherDetails?.classTeacher ? "yes" : "no"}
                        onChange={(e) =>
                          handleEditTeacherChange(
                            "classTeacher",
                            e.target.value === "yes"
                          )
                        }
                      >
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </label>
                  </div>
                </div>
              ) : null}
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.button}
                type="button"
                onClick={handleEdit}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}