"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "../styles/home.module.css";
import type { Student } from "./data";
import { apiUrl } from "../../lib/api";
import StudentProfileModal from "./StudentProfileModal";

// Generate academic year options: e.g. 2023-24, 2024-25, 2025-26, 2026-27
function getAcademicYearOptions(): string[] {
  const current = new Date().getFullYear();
  return [current - 1, current, current + 1].map(
    (y) => `${y}-${String(y + 1).slice(-2)}`
  );
}

type FeeManagementProps = {
  students: Student[];
  isLoading?: boolean;
  classCode?: string;
};

type SchoolProfile = {
  schoolName?: string;
  logoUrl?: string;
  schoolUrl?: string;
  brandName?: string;
  appTitle?: string;
  address?: string;
  phone?: string;
};

type FeeType = {
  id: number;
  name: string;
  active: boolean;
};

type FeeStructure = {
  id: number;
  classCode: string;
  feeTypeId: number;
  amount: number;
  frequency: "MONTHLY" | "YEARLY" | "ONE_TIME";
  academicYear: string;
  effectiveFrom: string;
  dueDay?: number;
  active: boolean;
};

type FeeDue = {
  id: number;
  studentId: string;
  feeTypeId: number;
  amount: string;
  dueDate: string;
  remainingAmount: string;
  status: "PAID" | "UNPAID" | "PARTIAL";
};

type DefaultDiscount = {
  id: number;
  name: string;
  discountType: "PERCENTAGE" | "FIXED";
  value: string;
  applicableOn: string;
  active: boolean;
};

type StudentDiscount = {
  id: number;
  studentId: string;
  discountId: number;
  startDate: string;
  endDate: string;
  active: boolean;
};

type FineRule = {
  id: number;
  daysFrom: number;
  daysTo: number;
  fineType: "PER_DAY" | "FIXED";
  value: string;
  active: boolean;
};

type FeePaymentDetail = {
  id: number;
  dueId: number;
  dueAmount: string;
  defaultDiscount: string;
  extraDiscount: string;
  fineAmount: string;
  finalAmount: string;
  paidAmount: string;
  extraDiscountReason?: string;
  approvedBy?: string;
};

type FeePayment = {
  id: number;
  studentId: string;
  totalDue: string;
  totalDefaultDiscount: string;
  totalExtraDiscount: string;
  totalFine: string;
  finalAmount: string;
  paidAmount: string;
  paymentDate: string;
  paymentMode: string;
  receiptNumber?: string | null;
  details: FeePaymentDetail[];
};

const tabs = [
  "Fee Types",
  "Fee Structure",
  "Generate Dues",
  "Payments",
  "Discounts & Fines",
] as const;
type Tab = (typeof tabs)[number];

export default function FeeManagement({ students, isLoading, classCode: activeClassCode }: FeeManagementProps) {
  const [activeTab, setActiveTab] = useState<Tab>("Fee Types");

  const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [feeDues, setFeeDues] = useState<FeeDue[]>([]);
  const [defaultDiscounts, setDefaultDiscounts] = useState<DefaultDiscount[]>([]);
  const [studentDiscounts, setStudentDiscounts] = useState<StudentDiscount[]>([]);
  const [fineRules, setFineRules] = useState<FineRule[]>([]);
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [feeStudents, setFeeStudents] = useState<Student[]>([]);
  const [classOptions, setClassOptions] = useState<
    { classCode: string; name: string; section: string }[]
  >([]);

  const [feeTypeForm, setFeeTypeForm] = useState<FeeType>({
    id: 0,
    name: "",
    active: true,
  });

  const [feeStructureForm, setFeeStructureForm] = useState<FeeStructure>({
    id: 0,
    classCode: "",
    feeTypeId: 0,
    amount: 0,
    frequency: "MONTHLY",
    academicYear: "",
    effectiveFrom: "",
    dueDay: 1,
    active: true,
  });
  // IDs of all structures in the current edit group (empty = create mode)
  const [editingGroupIds, setEditingGroupIds] = useState<number[]>([]);

  const [generateForm, setGenerateForm] = useState({
    classCode: "",
    month: new Date().toISOString().slice(0, 7),
    academicYear: "",
  });

  // Keep generateForm.classCode in sync with the top-level class filter
  // Resolve classCode (e.g. "1A") to grade name (e.g. "1")
  useEffect(() => {
    if (activeClassCode && activeClassCode !== "all") {
      const cls = classOptions.find((c) => c.classCode === activeClassCode);
      setGenerateForm((prev) => ({ ...prev, classCode: cls ? cls.name : activeClassCode }));
    } else {
      setGenerateForm((prev) => ({ ...prev, classCode: "" }));
    }
  }, [activeClassCode, classOptions]);

  const [paymentClassFilter, setPaymentClassFilter] = useState(
    activeClassCode && activeClassCode !== "all" ? activeClassCode : ""
  );

  const [paymentForm, setPaymentForm] = useState({
    studentId: "",
    paidAmount: "",
    paymentDate: new Date().toISOString().slice(0, 10),
    paymentMode: "Cash",
    extraDiscount: "",
    extraDiscountReason: "",
    approvedBy: "",
  });

  const [defaultDiscountForm, setDefaultDiscountForm] = useState<DefaultDiscount>({
    id: 0,
    name: "",
    discountType: "PERCENTAGE",
    value: "",
    applicableOn: "ALL",
    active: true,
  });

  const [studentDiscountForm, setStudentDiscountForm] = useState<StudentDiscount>({
    id: 0,
    studentId: "",
    discountId: 0,
    startDate: "",
    endDate: "",
    active: true,
  });

  const [fineRuleForm, setFineRuleForm] = useState<FineRule>({
    id: 0,
    daysFrom: 0,
    daysTo: 0,
    fineType: "PER_DAY",
    value: "",
    active: true,
  });

  const [dueFilters, setDueFilters] = useState({
    studentId: "",
    status: "all",
    name: "",
    month: "",
    rollNumber: "",
  });

  const [paymentFilters, setPaymentFilters] = useState({
    name: "",
    month: "",
    rollNumber: "",
  });

  const PAGE_SIZE = 15;
  const [duesPage, setDuesPage] = useState(1);
  const [paymentsPage, setPaymentsPage] = useState(1);

  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [feeLoading, setFeeLoading] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>({});

  // Delete confirmation dialog
  const [deleteConfirm, setDeleteConfirm] = useState<{ urls: string[]; label: string } | null>(null);

  // Student profile viewer (click name in tables)
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [showDiscountInfo, setShowDiscountInfo] = useState(false);
  const [showPaymentInfo, setShowPaymentInfo] = useState(false);

  // Academic year options derived from current year
  const academicYearOptions = useMemo(() => getAcademicYearOptions(), []);

  const showMessage = (text: string, type: "success" | "error" = "success") => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(null), 4000);
  };
  const token = typeof window !== "undefined" ? window.localStorage.getItem("authToken") : null;
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  const studentMap = useMemo(() => {
    const source = feeStudents.length ? feeStudents : students;
    return new Map(source.map((student) => [student.id, student]));
  }, [feeStudents, students]);

  const feeTypeMap = useMemo(() => {
    return new Map(feeTypes.map((type) => [type.id, type]));
  }, [feeTypes]);

  // Unique class names for fee structure dropdown (e.g. "1", "2", "UKG")
  const uniqueGrades = useMemo(() => {
    const seen = new Set<string>();
    return classOptions.filter((cls) => {
      if (seen.has(cls.name)) return false;
      seen.add(cls.name);
      return true;
    });
  }, [classOptions]);

  // classCode (e.g. "1A") → class name/grade (e.g. "1")
  const classCodeToName = useMemo(() => {
    const map = new Map<string, string>();
    classOptions.forEach((cls) => map.set(cls.classCode, cls.name));
    return map;
  }, [classOptions]);

  // Group fee structures by (gradeName, feeTypeId, academicYear, effectiveFrom)
  // so the table shows one row per class-level group, not per section.
  type FeeStructureGroup = {
    key: string;
    gradeName: string;
    feeTypeId: number;
    academicYear: string;
    effectiveFrom: string;
    amount: number;
    frequency: FeeStructure["frequency"];
    dueDay: number;
    active: boolean;
    memberIds: number[];
    classCodes: string[];
    inconsistent: boolean;
  };

  const groupedFeeStructures = useMemo((): FeeStructureGroup[] => {
    const map = new Map<string, FeeStructureGroup>();
    for (const s of feeStructures) {
      const gradeName = classCodeToName.get(s.classCode) ?? s.classCode;
      const dueDay = (s as unknown as { dueDay?: number; due_day?: number }).dueDay ??
        (s as unknown as { dueDay?: number; due_day?: number }).due_day ?? 0;
      const key = `${gradeName}|${s.feeTypeId}|${s.academicYear}|${s.effectiveFrom}`;
      const existing = map.get(key);
      if (existing) {
        existing.memberIds.push(s.id);
        existing.classCodes.push(s.classCode);
        if (
          s.amount !== existing.amount ||
          s.frequency !== existing.frequency ||
          dueDay !== existing.dueDay ||
          s.active !== existing.active
        ) {
          existing.inconsistent = true;
        }
      } else {
        map.set(key, {
          key,
          gradeName,
          feeTypeId: s.feeTypeId,
          academicYear: s.academicYear,
          effectiveFrom: s.effectiveFrom,
          amount: s.amount,
          frequency: s.frequency,
          dueDay,
          active: s.active,
          memberIds: [s.id],
          classCodes: [s.classCode],
          inconsistent: false,
        });
      }
    }
    return Array.from(map.values());
  }, [feeStructures, classCodeToName]);

  const resetFeeStructureForm = () => {
    setFeeStructureForm({ id: 0, classCode: "", feeTypeId: 0, amount: 0, frequency: "MONTHLY", academicYear: "", effectiveFrom: "", dueDay: 1, active: true });
    setEditingGroupIds([]);
  };

  const fetchJson = async (url: string) => {
    const res = await fetch(apiUrl(url), { headers });
    if (!res.ok) return [];
    return res.json();
  };

  const fetchObject = async (url: string) => {
    const res = await fetch(apiUrl(url), { headers });
    if (!res.ok) return {};
    return res.json();
  };

  const loadAll = async () => {
    setFeeLoading(true);
    try {
      const [
        typesData,
        structuresData,
        duesData,
        defaultDiscountData,
        studentDiscountData,
        fineRulesData,
        paymentsData,
        classData,
        studentData,
        profileData,
      ] = await Promise.all([
        fetchJson("/api/fees/types"),
        fetchJson("/api/fees/structures"),
        fetchJson("/api/fees/dues"),
        fetchJson("/api/fees/discounts/default"),
        fetchJson("/api/fees/discounts/student"),
        fetchJson("/api/fees/fines"),
        fetchJson("/api/fees/payments"),
        fetchJson("/api/classes/manage"),
        fetchJson("/api/students"),
        fetchObject("/api/school"),
      ]);
      setFeeTypes(Array.isArray(typesData) ? typesData : []);
      setFeeStructures(Array.isArray(structuresData) ? structuresData : []);
      setFeeDues(Array.isArray(duesData) ? duesData : []);
      setDefaultDiscounts(Array.isArray(defaultDiscountData) ? defaultDiscountData : []);
      setStudentDiscounts(Array.isArray(studentDiscountData) ? studentDiscountData : []);
      setFineRules(Array.isArray(fineRulesData) ? fineRulesData : []);
      setPayments(Array.isArray(paymentsData) ? paymentsData : []);
      setClassOptions(Array.isArray(classData) ? classData : []);
      setFeeStudents(Array.isArray(studentData) ? studentData : []);
      setSchoolProfile(profileData && typeof profileData === "object" ? profileData : {});
    } finally {
      setFeeLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveEntity = async (
    url: string,
    method: "POST" | "PUT",
    body: Record<string, unknown>
  ) => {
    const response = await fetch(apiUrl(url), {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(headers ?? {}),
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error ?? "Unable to save");
    }
    await loadAll();
  };

  const deleteEntity = async (url: string) => {
    const response = await fetch(apiUrl(url), { method: "DELETE", headers });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error ?? "Unable to delete");
    }
    await loadAll();
  };

  // Opens the confirm dialog; actual delete happens only on confirmation
  const confirmDelete = (url: string | string[], label: string) => {
    setDeleteConfirm({ urls: Array.isArray(url) ? url : [url], label });
  };

  const handleConfirmedDelete = async () => {
    if (!deleteConfirm) return;
    const label = deleteConfirm.label;
    try {
      for (const url of deleteConfirm.urls) {
        const response = await fetch(apiUrl(url), { method: "DELETE", headers });
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err?.error ?? "Unable to delete");
        }
      }
      await loadAll();
      // If we deleted structures that were being edited, clear the form
      if (editingGroupIds.length > 0) resetFeeStructureForm();
      setDeleteConfirm(null);
      showMessage(`${label} deleted successfully.`);
    } catch (err) {
      await loadAll();
      const msg = err instanceof Error ? err.message : "Unable to delete";
      setDeleteConfirm(null);
      showMessage(msg, "error");
    }
  };

  const handlePayment = async () => {
    if (!paymentForm.studentId) { showMessage("Please select a student.", "error"); return; }
    if (!paymentForm.paidAmount || parseFloat(paymentForm.paidAmount) <= 0) { showMessage("Please enter a valid paid amount.", "error"); return; }
    if (!paymentForm.paymentDate) { showMessage("Please select a payment date.", "error"); return; }
    if (!paymentForm.paymentMode) { showMessage("Please select a payment mode.", "error"); return; }
    setSavingKey("payment");
    try {
      await saveEntity("/api/fees/payments", "POST", paymentForm);
      setPaymentForm({
        studentId: "",
        paidAmount: "",
        paymentDate: new Date().toISOString().slice(0, 10),
        paymentMode: "Cash",
        extraDiscount: "",
        extraDiscountReason: "",
        approvedBy: "",
      });
      showMessage("Payment recorded successfully.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unable to record payment";
      showMessage(msg, "error");
    } finally {
      setSavingKey(null);
    }
  };

  const openReceipt = (payment: FeePayment) => {
    const student = studentMap.get(payment.studentId);

    // Build a dueId → FeeDue map for fee type name resolution
    const dueIdMap = new Map(feeDues.map((d) => [d.id, d]));

    // Helper: number to words (simple, up to lakhs)
    const numToWords = (n: number): string => {
      if (n === 0) return "Zero";
      const ones = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine",
        "Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
      const tens = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
      const convert = (num: number): string => {
        if (num < 20) return ones[num];
        if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? " " + ones[num % 10] : "");
        if (num < 1000) return ones[Math.floor(num / 100)] + " Hundred" + (num % 100 ? " " + convert(num % 100) : "");
        if (num < 100000) return convert(Math.floor(num / 1000)) + " Thousand" + (num % 1000 ? " " + convert(num % 1000) : "");
        return convert(Math.floor(num / 100000)) + " Lakh" + (num % 100000 ? " " + convert(num % 100000) : "");
      };
      const [intPart, decPart] = n.toFixed(2).split(".");
      const words = convert(parseInt(intPart));
      return words + (parseInt(decPart) > 0 ? " and " + convert(parseInt(decPart)) + " Paise" : "") + " Only";
    };

    // Format date nicely
    const formatDate = (d: string) => {
      try { return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
      catch { return d; }
    };

    // Derive fee month label from dues in payment
    const feeMonths = [...new Set(payment.details.map((det) => {
      const due = dueIdMap.get(det.dueId);
      if (!due) return null;
      const dd = new Date(due.dueDate);
      return dd.toLocaleString("en-IN", { month: "long", year: "numeric" });
    }).filter(Boolean))].join(", ");

    const totalDefaultDiscount = parseFloat(payment.totalDefaultDiscount) || 0;
    const totalExtraDiscount = parseFloat(payment.totalExtraDiscount) || 0;
    const totalFine = parseFloat(payment.totalFine) || 0;
    const totalDue = parseFloat(payment.totalDue) || 0;
    const finalAmount = parseFloat(payment.finalAmount) || 0;
    const paidAmount = parseFloat(payment.paidAmount) || 0;
    const balance = finalAmount - paidAmount;

    // Build applicable discounts info for receipt
    const activeDefaults = defaultDiscounts.filter((d) => d.active);
    const studentSpecificDiscounts = studentDiscounts
      .filter((sd) => sd.active && sd.studentId === payment.studentId)
      .filter((sd) => sd.startDate <= payment.paymentDate && sd.endDate >= payment.paymentDate)
      .map((sd) => {
        const def = defaultDiscounts.find((d) => d.id === sd.discountId);
        return def ? { ...def, startDate: sd.startDate, endDate: sd.endDate } : null;
      })
      .filter(Boolean) as (DefaultDiscount & { startDate: string; endDate: string })[];

    const resolveApplicableLabel = (applicableOn: string) => {
      if (applicableOn === "ALL") return "All Fee Types";
      if (applicableOn === "TUITION") return feeTypes.find((t) => t.name.toLowerCase().includes("tuition") || t.name.toLowerCase().includes("tution"))?.name ?? "Tuition";
      if (applicableOn === "TRANSPORT") return feeTypes.find((t) => t.name.toLowerCase().includes("transport"))?.name ?? "Transport";
      return feeTypeMap.get(Number(applicableOn))?.name ?? applicableOn;
    };

    const discountLines = [
      ...activeDefaults.map((d) =>
        `<li>${d.name} — ${d.discountType === "PERCENTAGE" ? `${d.value}%` : `₹${d.value}`} on ${resolveApplicableLabel(d.applicableOn)}</li>`
      ),
      ...studentSpecificDiscounts.map((d) =>
        `<li>${d.name} — ${d.discountType === "PERCENTAGE" ? `${d.value}%` : `₹${d.value}`} on ${resolveApplicableLabel(d.applicableOn)} <span style="color:#64748b;font-size:9px;">(Student-specific)</span></li>`
      ),
    ].join("");

    const detailRows = payment.details.map((detail, idx) => {
      const due = dueIdMap.get(detail.dueId);
      const feeTypeName = due ? (feeTypeMap.get(due.feeTypeId)?.name ?? `Fee #${due.feeTypeId}`) : `Due #${detail.dueId}`;
      const net = parseFloat(detail.finalAmount) || 0;
      return `
        <tr>
          <td style="padding:6px 10px;border:1px solid #d1d5db;">${idx + 1}</td>
          <td style="padding:6px 10px;border:1px solid #d1d5db;">${feeTypeName}</td>
          <td style="padding:6px 10px;border:1px solid #d1d5db;text-align:right;">₹${parseFloat(detail.dueAmount).toFixed(2)}</td>
          <td style="padding:6px 10px;border:1px solid #d1d5db;text-align:right;">₹${parseFloat(detail.defaultDiscount).toFixed(2)}</td>
          <td style="padding:6px 10px;border:1px solid #d1d5db;text-align:right;">₹${parseFloat(detail.fineAmount).toFixed(2)}</td>
          <td style="padding:6px 10px;border:1px solid #d1d5db;text-align:right;font-weight:600;">₹${net.toFixed(2)}</td>
        </tr>`;
    }).join("");

    const schoolDisplayName = schoolProfile.schoolName ?? schoolProfile.brandName ?? schoolProfile.appTitle ?? "School Management Portal";
    const schoolWebsite = schoolProfile.schoolUrl ?? "";
    const schoolAddress = schoolProfile.address ?? "";
    const schoolPhone = schoolProfile.phone ?? "";
    const logoInitial = schoolDisplayName.charAt(0).toUpperCase();
    const logoHtml = schoolProfile.logoUrl
      ? `<img src="${schoolProfile.logoUrl}" alt="School Logo" style="width:64px;height:64px;object-fit:contain;border-radius:4px;" />`
      : `<div style="width:64px;height:64px;border-radius:50%;background:#166534;display:flex;align-items:center;justify-content:center;color:#fff;font-size:22px;font-weight:900;flex-shrink:0;">${logoInitial}</div>`;

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Fee Receipt - ${payment.receiptNumber ?? ""}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; color: #1e293b; background: #fff; font-size: 12px; }
    .page { width: 210mm; min-height: 297mm; margin: 0 auto; padding: 12mm; }

    /* Header */
    .school-header { display: flex; align-items: center; gap: 16px; border-bottom: 3px solid #166534; padding-bottom: 10px; margin-bottom: 10px; }
    .school-logo { width: 64px; height: 64px; border-radius: 50%; background: #166534; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 22px; font-weight: 900; flex-shrink: 0; }
    .school-info { flex: 1; text-align: center; }
    .school-name { font-size: 20px; font-weight: 800; color: #14532d; letter-spacing: 0.5px; text-transform: uppercase; }
    .school-tagline { font-size: 10px; color: #166534; margin: 2px 0; }
    .school-address { font-size: 10px; color: #475569; }
    .receipt-badge { width: 80px; text-align: right; }
    .receipt-badge .label { font-size: 9px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
    .receipt-badge .number { font-size: 13px; font-weight: 700; color: #14532d; }
    .receipt-badge .date { font-size: 10px; color: #475569; }

    /* Title bar */
    .receipt-title { background: #166534; color: #fff; text-align: center; padding: 5px; font-size: 13px; font-weight: 700; letter-spacing: 1px; margin-bottom: 10px; border-radius: 2px; }

    /* Student info */
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; border: 1px solid #d1d5db; border-radius: 4px; overflow: hidden; margin-bottom: 10px; }
    .info-row { display: contents; }
    .info-cell { padding: 5px 10px; border-bottom: 1px solid #e5e7eb; display: flex; gap: 6px; }
    .info-cell:nth-child(odd) { border-right: 1px solid #d1d5db; background: #f8fafc; }
    .info-label { color: #64748b; font-weight: 600; min-width: 90px; font-size: 11px; }
    .info-value { color: #0f172a; font-weight: 500; font-size: 11px; }
    .photo-cell { grid-column: span 2; display: flex; justify-content: flex-end; padding: 6px 10px; background: #f8fafc; border-bottom: 1px solid #e5e7eb; }
    .photo-box { width: 52px; height: 60px; border: 1px solid #cbd5e1; background: #f1f5f9; display: flex; align-items: center; justify-content: center; font-size: 9px; color: #94a3b8; text-align: center; border-radius: 2px; }

    /* Fee table */
    .section-title { font-size: 11px; font-weight: 700; color: #14532d; text-transform: uppercase; letter-spacing: 0.5px; margin: 10px 0 4px; border-left: 3px solid #166534; padding-left: 6px; }
    .fee-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 11px; }
    .fee-table thead tr { background: #14532d; color: #fff; }
    .fee-table thead th { padding: 6px 10px; text-align: left; font-weight: 600; border: 1px solid #166534; }
    .fee-table thead th:not(:first-child) { text-align: right; }
    .fee-table tbody tr:nth-child(even) { background: #f0fdf4; }
    .fee-table tfoot tr { background: #dcfce7; font-weight: 700; }
    .fee-table tfoot td { padding: 6px 10px; border: 1px solid #d1d5db; }

    /* Summary + QR row */
    .bottom-row { display: grid; grid-template-columns: 1fr auto 1fr; gap: 12px; margin-top: 10px; align-items: start; }
    .summary-box { border: 1px solid #d1d5db; border-radius: 4px; overflow: hidden; font-size: 11px; }
    .summary-box .sum-row { display: flex; justify-content: space-between; padding: 4px 10px; border-bottom: 1px solid #e5e7eb; }
    .summary-box .sum-row:last-child { border-bottom: none; }
    .summary-box .sum-row.highlight { background: #14532d; color: #fff; font-weight: 700; font-size: 12px; }
    .summary-box .sum-row.balance-row { background: #fef2f2; color: #991b1b; font-weight: 700; }
    .sum-label { color: inherit; }
    .sum-value { font-weight: 600; }

    .qr-area { display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .qr-box { width: 72px; height: 72px; border: 1px solid #d1d5db; background: #f8fafc; display: flex; align-items: center; justify-content: center; font-size: 9px; color: #94a3b8; text-align: center; border-radius: 4px; }
    .qr-label { font-size: 9px; color: #64748b; }

    .remark-box { font-size: 11px; }
    .remark-label { font-weight: 700; color: #14532d; margin-bottom: 4px; font-size: 11px; }
    .remark-line { border-bottom: 1px solid #d1d5db; height: 20px; margin-bottom: 6px; }

    /* Amount in words */
    .words-bar { border: 1px dashed #166534; border-radius: 4px; padding: 6px 10px; font-size: 11px; margin-bottom: 10px; background: #f0fdf4; }
    .words-bar span { font-weight: 700; color: #14532d; }

    /* Footer */
    .receipt-footer { display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid #d1d5db; padding-top: 10px; margin-top: 10px; }
    .mode-box { font-size: 11px; }
    .mode-label { color: #64748b; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
    .mode-value { font-weight: 700; font-size: 13px; color: #14532d; }
    .sig-box { text-align: center; font-size: 11px; }
    .sig-line { border-top: 1px solid #0f172a; width: 140px; margin: 0 auto 4px; }
    .note { font-size: 9px; color: #94a3b8; text-align: center; margin-top: 10px; border-top: 1px dashed #e2e8f0; padding-top: 6px; }

    @media print {
      body { margin: 0; }
      .page { padding: 8mm; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
<div class="page">

  <!-- School Header -->
  <div class="school-header">
    ${logoHtml}
    <div class="school-info">
      <div class="school-name">${schoolDisplayName}</div>
      <div class="school-tagline">Empowering Education, Shaping Futures</div>
      <div class="school-address">
        ${schoolAddress ? `${schoolAddress}` : ""}
        ${schoolAddress && (schoolPhone || schoolWebsite) ? "&nbsp;|&nbsp;" : ""}
        ${schoolPhone ? `Phone: ${schoolPhone}` : ""}
        ${schoolPhone && schoolWebsite ? "&nbsp;|&nbsp;" : ""}
        ${schoolWebsite ? `<a href="${schoolWebsite}" style="color:#166534;text-decoration:none;">${schoolWebsite}</a>` : ""}
      </div>
    </div>
    <div class="receipt-badge">
      <div class="label">Receipt No.</div>
      <div class="number">${payment.receiptNumber ?? "—"}</div>
      <div class="date">${formatDate(payment.paymentDate)}</div>
    </div>
  </div>

  <div class="receipt-title">FEE RECEIPT</div>

  <!-- Student Info -->
  <div class="info-grid">
    <div class="info-cell">
      <span class="info-label">Student Name</span>
      <span class="info-value">${student?.name ?? payment.studentId}</span>
    </div>
    <div class="info-cell">
      <span class="info-label">Father's Name</span>
      <span class="info-value">${student?.fatherName ?? student?.parentName ?? "—"}</span>
    </div>
    <div class="info-cell">
      <span class="info-label">Class</span>
      <span class="info-value">${student?.grade ?? "—"}</span>
    </div>
    <div class="info-cell">
      <span class="info-label">Section</span>
      <span class="info-value">${student?.section ?? "—"}</span>
    </div>
    <div class="info-cell">
      <span class="info-label">Roll No.</span>
      <span class="info-value">${student?.rollNumber ?? "—"}</span>
    </div>
    <div class="info-cell">
      <span class="info-label">Admission No.</span>
      <span class="info-value">${student?.admissionNumber ?? "—"}</span>
    </div>
    <div class="info-cell">
      <span class="info-label">Mobile</span>
      <span class="info-value">${student?.parentPhone ?? "—"}</span>
    </div>
    <div class="info-cell">
      <span class="info-label">Session</span>
      <span class="info-value">${student?.session ?? "—"}</span>
    </div>
    <div class="info-cell" style="grid-column: span 1;">
      <span class="info-label">Fee Month</span>
      <span class="info-value">${feeMonths || "—"}</span>
    </div>
    <div class="info-cell" style="display:flex;justify-content:flex-end;align-items:flex-start;background:#fff;">
      <div class="photo-box">Photo</div>
    </div>
  </div>

  <!-- Fee Particulars -->
  <div class="section-title">Fee Particulars</div>
  <table class="fee-table">
    <thead>
      <tr>
        <th style="width:36px;">#</th>
        <th>Fee Type</th>
        <th>Amount (₹)</th>
        <th>Def. Discount</th>
        <th>Fine</th>
        <th>Net Amount</th>
      </tr>
    </thead>
    <tbody>
      ${detailRows || `<tr><td colspan="6" style="padding:10px;text-align:center;color:#64748b;">No details</td></tr>`}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="2" style="border:1px solid #d1d5db;">Total</td>
        <td style="border:1px solid #d1d5db;text-align:right;">₹${totalDue.toFixed(2)}</td>
        <td style="border:1px solid #d1d5db;text-align:right;">₹${totalDefaultDiscount.toFixed(2)}</td>
        <td style="border:1px solid #d1d5db;text-align:right;">₹${totalFine.toFixed(2)}</td>
        <td style="border:1px solid #d1d5db;text-align:right;">₹${finalAmount.toFixed(2)}</td>
      </tr>
    </tfoot>
  </table>

  ${(totalDefaultDiscount > 0 || totalExtraDiscount > 0) && discountLines ? `
  <!-- Discounts Applied -->
  <div style="border:1px solid #bbf7d0;border-radius:4px;padding:6px 10px;margin-bottom:8px;background:#f0fdf4;font-size:10px;color:#14532d;">
    <strong style="font-size:11px;">Discounts Applied:</strong>
    <ul style="margin:3px 0 0 16px;padding:0;">${discountLines}</ul>
  </div>
  ` : ""}

  <!-- Amount in Words -->
  <div class="words-bar">
    Amount Paid in Words: <span>${numToWords(paidAmount)}</span>
  </div>

  <!-- Bottom: Summary + QR + Remarks -->
  <div class="bottom-row">
    <div class="summary-box">
      <div class="sum-row"><span class="sum-label">Total Fee</span><span class="sum-value">₹${totalDue.toFixed(2)}</span></div>
      <div class="sum-row"><span class="sum-label">Default Concession</span><span class="sum-value">- ₹${totalDefaultDiscount.toFixed(2)}</span></div>
      <div class="sum-row"><span class="sum-label">Extra Concession</span><span class="sum-value">- ₹${totalExtraDiscount.toFixed(2)}</span></div>
      <div class="sum-row"><span class="sum-label">Late Fine</span><span class="sum-value">+ ₹${totalFine.toFixed(2)}</span></div>
      <div class="sum-row"><span class="sum-label">Net Fee</span><span class="sum-value">₹${finalAmount.toFixed(2)}</span></div>
      <div class="sum-row highlight"><span class="sum-label">Amount Received</span><span class="sum-value">₹${paidAmount.toFixed(2)}</span></div>
      ${balance > 0.009 ? `<div class="sum-row balance-row"><span class="sum-label">Balance Due</span><span class="sum-value">₹${balance.toFixed(2)}</span></div>` : `<div class="sum-row" style="background:#f0fdf4;color:#166534;"><span class="sum-label">Balance Due</span><span class="sum-value">₹0.00 ✓</span></div>`}
    </div>

    <div class="qr-area">
      <div class="qr-box">QR<br/>Code</div>
      <div class="qr-label">Scan to verify</div>
    </div>

    <div class="remark-box">
      <div class="remark-label">Payment Mode</div>
      <div style="font-size:13px;font-weight:700;color:#14532d;margin-bottom:8px;">${payment.paymentMode ?? "—"}</div>
      <div class="remark-label">Remark</div>
      <div class="remark-line"></div>
      <div class="remark-line"></div>
    </div>
  </div>

  <!-- Footer -->
  <div class="receipt-footer">
    <div class="mode-box">
      <div class="mode-label">Generated On</div>
      <div class="mode-value" style="font-size:11px;">${new Date().toLocaleString("en-IN")}</div>
    </div>
    <div style="font-size:10px;color:#64748b;text-align:center;">
      This is a computer-generated receipt.<br/>No signature required.
    </div>
    <div class="sig-box">
      <div style="height:32px;"></div>
      <div class="sig-line"></div>
      <div>Received By / Authorised Signatory</div>
    </div>
  </div>

  <div class="note">
    ★ Please retain this receipt for your records &nbsp;|&nbsp; For queries contact the school office
  </div>

  <div class="no-print" style="margin-top:16px;text-align:center;">
    <button onclick="window.print()" style="background:#166534;color:#fff;border:none;padding:8px 24px;border-radius:4px;font-size:13px;cursor:pointer;margin-right:8px;">🖨 Print Receipt</button>
    <button onclick="window.close()" style="background:#f1f5f9;color:#0f172a;border:1px solid #d1d5db;padding:8px 24px;border-radius:4px;font-size:13px;cursor:pointer;">✕ Close</button>
  </div>

</div>
</body>
</html>`;

    const receiptWindow = window.open("", "_blank");
    if (!receiptWindow) return;
    receiptWindow.document.open();
    receiptWindow.document.write(html);
    receiptWindow.document.close();
  };

  // Resolve grade name to all section classCodes, or all classCodes if empty
  const resolveClassCodes = (gradeName: string): string[] => {
    if (!gradeName) return classOptions.map((cls) => cls.classCode);
    const sections = classOptions.filter((cls) => cls.name === gradeName);
    return sections.length > 0 ? sections.map((s) => s.classCode) : [gradeName];
  };

  const handleGenerateDues = async () => {
    if (!generateForm.month) { showMessage("Please select a month.", "error"); return; }
    if (!generateForm.academicYear) { showMessage("Please select an academic year.", "error"); return; }
    setSavingKey("generateDues");
    try {
      const classCodes = resolveClassCodes(generateForm.classCode);
      for (const cc of classCodes) {
        const response = await fetch(apiUrl("/api/fees/dues/generate"), {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(headers ?? {}) },
          body: JSON.stringify({ ...generateForm, classCode: cc }),
        });
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err?.error ?? `Unable to generate dues for ${cc}`);
        }
      }
      await loadAll();
      showMessage("Dues generated successfully.");
    } catch (err) {
      await loadAll();
      const msg = err instanceof Error ? err.message : "Unable to generate dues";
      showMessage(msg, "error");
    } finally {
      setSavingKey(null);
    }
  };

  const handleRegenerateDues = async () => {
    if (!generateForm.month) { showMessage("Please select a month.", "error"); return; }
    if (!generateForm.academicYear) { showMessage("Please select an academic year.", "error"); return; }
    const currentMonth = new Date().toISOString().slice(0, 7);
    if (generateForm.month && generateForm.month < currentMonth) {
      showMessage(
        `Regenerate is not allowed for past months (${generateForm.month}). Please select ${currentMonth} or a future month.`,
        "error"
      );
      return;
    }
    setSavingKey("regenerateDues");
    try {
      const classCodes = resolveClassCodes(generateForm.classCode);
      for (const cc of classCodes) {
        const response = await fetch(apiUrl("/api/fees/dues/regenerate"), {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(headers ?? {}) },
          body: JSON.stringify({ ...generateForm, classCode: cc }),
        });
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err?.error ?? `Unable to regenerate dues for ${cc}`);
        }
      }
      await loadAll();
      showMessage("Dues regenerated successfully (unpaid only).");
    } catch (err) {
      await loadAll();
      const msg = err instanceof Error ? err.message : "Unable to regenerate dues";
      showMessage(msg, "error");
    } finally {
      setSavingKey(null);
    }
  };

  const handleSaveFeeType = async () => {
    if (!feeTypeForm.name.trim()) { showMessage("Please enter a fee type name.", "error"); return; }
    setSavingKey("feeType");
    try {
      await saveEntity(
        feeTypeForm.id ? `/api/fees/types/${feeTypeForm.id}` : "/api/fees/types",
        feeTypeForm.id ? "PUT" : "POST",
        feeTypeForm as unknown as Record<string, unknown>
      );
      setFeeTypeForm({ id: 0, name: "", active: true });
      showMessage(feeTypeForm.id ? "Fee type updated." : "Fee type saved.");
    } catch (err) {
      let msg = err instanceof Error ? err.message : "Failed to save fee type.";
      if (msg.includes("Duplicate entry")) {
        msg = `A fee type named "${feeTypeForm.name}" already exists. Please use a different name.`;
      }
      showMessage(msg, "error");
    } finally {
      setSavingKey(null);
    }
  };

  const handleSaveFeeStructure = async () => {
    if (!feeStructureForm.classCode) { showMessage("Please select a class.", "error"); return; }
    if (!feeStructureForm.feeTypeId) { showMessage("Please select a fee type.", "error"); return; }
    if (!feeStructureForm.amount || feeStructureForm.amount <= 0) { showMessage("Please enter a valid amount greater than 0.", "error"); return; }
    if (!feeStructureForm.academicYear) { showMessage("Please select an academic year.", "error"); return; }
    if (!feeStructureForm.effectiveFrom) { showMessage("Please select an effective from date.", "error"); return; }
    if (!feeStructureForm.dueDay || feeStructureForm.dueDay < 1 || feeStructureForm.dueDay > 28) { showMessage("Please enter a due day between 1 and 28.", "error"); return; }

    const gradeName = feeStructureForm.classCode;
    const gradeSections = classOptions.filter((cls) => cls.name === gradeName);
    const allClassCodes = gradeSections.length > 0 ? gradeSections.map((s) => s.classCode) : [gradeName];

    setSavingKey("feeStructure");

    const postJson = async (url: string, method: "POST" | "PUT", body: Record<string, unknown>) => {
      const res = await fetch(apiUrl(url), {
        method,
        headers: { "Content-Type": "application/json", ...(headers ?? {}) },
        body: JSON.stringify(body),
      });
      return res.ok;
    };

    if (editingGroupIds.length > 0) {
      // ── EDIT MODE ──────────────────────────────────────────────────────────
      // The group was loaded when Edit was clicked. Update every structure in
      // the group; also POST for any sections of this grade that weren't in the
      // original group (e.g. a new section was added to the school later).
      const existingInGroup = feeStructures.filter((s) => editingGroupIds.includes(s.id));
      const existingCCs = existingInGroup.map((s) => s.classCode);
      const missingSections = allClassCodes.filter((cc) => !existingCCs.includes(cc));

      // Check that the missing sections don't already have a *different* structure
      // for the same (feeType + academicYear) — if they do, skip them.
      const conflicting = missingSections.filter((cc) =>
        feeStructures.some(
          (s) =>
            s.classCode === cc &&
            s.feeTypeId === feeStructureForm.feeTypeId &&
            s.academicYear === feeStructureForm.academicYear &&
            s.effectiveFrom === feeStructureForm.effectiveFrom &&
            !editingGroupIds.includes(s.id)
        )
      );
      const toCreate = missingSections.filter((cc) => !conflicting.includes(cc));

      const results: { classCode: string; ok: boolean }[] = [];

      for (const s of existingInGroup) {
        const ok = await postJson(`/api/fees/structures/${s.id}`, "PUT", {
          ...feeStructureForm,
          classCode: s.classCode,
          id: s.id,
        } as unknown as Record<string, unknown>);
        results.push({ classCode: s.classCode, ok });
      }
      for (const cc of toCreate) {
        const ok = await postJson("/api/fees/structures", "POST", {
          ...feeStructureForm,
          classCode: cc,
          id: 0,
        } as unknown as Record<string, unknown>);
        results.push({ classCode: cc, ok });
      }

      await loadAll();

      const failedCCs = results.filter((r) => !r.ok).map((r) => r.classCode);
      const parts: string[] = [];
      if (failedCCs.length === 0) parts.push(`Updated all sections of Class ${gradeName}.`);
      else parts.push(`Updated most sections. Failed for: ${failedCCs.join(", ")}.`);
      if (conflicting.length) parts.push(`Skipped: ${conflicting.join(", ")} already have a different structure.`);

      showMessage(parts.join(" "), failedCCs.length > 0 || conflicting.length > 0 ? "error" : "success");
      if (failedCCs.length === 0) resetFeeStructureForm();

    } else {
      // ── CREATE MODE ────────────────────────────────────────────────────────
      // Before hitting the API, check the local feeStructures state for
      // (classCode + feeTypeId + academicYear + effectiveFrom) conflicts.
      const conflicting = allClassCodes.filter((cc) =>
        feeStructures.some(
          (s) =>
            s.classCode === cc &&
            s.feeTypeId === feeStructureForm.feeTypeId &&
            s.academicYear === feeStructureForm.academicYear &&
            s.effectiveFrom === feeStructureForm.effectiveFrom
        )
      );

      if (conflicting.length === allClassCodes.length) {
        showMessage(
          `A fee structure for Class ${gradeName} with this fee type, academic year, and effective date already exists. Click Edit on a row to update it.`,
          "error"
        );
        setSavingKey(null);
        return;
      }

      const toCreate = allClassCodes.filter((cc) => !conflicting.includes(cc));
      const results: { classCode: string; ok: boolean }[] = [];

      for (const cc of toCreate) {
        const ok = await postJson("/api/fees/structures", "POST", {
          ...feeStructureForm,
          classCode: cc,
        } as unknown as Record<string, unknown>);
        results.push({ classCode: cc, ok });
      }

      await loadAll();

      const saved = results.filter((r) => r.ok).map((r) => r.classCode);
      const failed = results.filter((r) => !r.ok).map((r) => r.classCode);
      const parts: string[] = [];
      if (saved.length) parts.push(`Saved for: ${saved.join(", ")}.`);
      if (conflicting.length) parts.push(`Already exists for: ${conflicting.join(", ")} — click Edit to update.`);
      if (failed.length) parts.push(`Failed for: ${failed.join(", ")}.`);

      showMessage(parts.join(" "), conflicting.length > 0 || failed.length > 0 ? "error" : "success");
      if (conflicting.length === 0 && failed.length === 0) resetFeeStructureForm();
    }

    setSavingKey(null);
  };

  const handleSaveDefaultDiscount = async () => {
    if (!defaultDiscountForm.name.trim()) { showMessage("Please enter a discount name.", "error"); return; }
    if (!defaultDiscountForm.value || parseFloat(defaultDiscountForm.value) <= 0) { showMessage("Please enter a valid value.", "error"); return; }
    if (!defaultDiscountForm.applicableOn) { showMessage("Please select applicable on.", "error"); return; }
    setSavingKey("defaultDiscount");
    try {
      const url = defaultDiscountForm.id ? `/api/fees/discounts/default/${defaultDiscountForm.id}` : "/api/fees/discounts/default";
      const method = defaultDiscountForm.id ? "PUT" : "POST";
      const response = await fetch(apiUrl(url), {
        method,
        headers: { "Content-Type": "application/json", ...(headers ?? {}) },
        body: JSON.stringify(defaultDiscountForm),
      });
      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody?.error ?? errBody?.message ?? `Server error: ${response.status}`);
      }
      await loadAll();
      setDefaultDiscountForm({ id: 0, name: "", discountType: "PERCENTAGE", value: "", applicableOn: "ALL", active: true });
      showMessage(defaultDiscountForm.id ? "Discount updated." : "Discount saved.");
    } catch (err) {
      showMessage(err instanceof Error ? err.message : "Failed to save discount.", "error");
    } finally {
      setSavingKey(null);
    }
  };

  const handleSaveStudentDiscount = async () => {
    if (!studentDiscountForm.studentId) { showMessage("Please select a student.", "error"); return; }
    if (!studentDiscountForm.discountId) { showMessage("Please select a discount.", "error"); return; }
    if (!studentDiscountForm.startDate) { showMessage("Please select a start date.", "error"); return; }
    if (!studentDiscountForm.endDate) { showMessage("Please select an end date.", "error"); return; }
    setSavingKey("studentDiscount");
    try {
      await saveEntity(
        studentDiscountForm.id ? `/api/fees/discounts/student/${studentDiscountForm.id}` : "/api/fees/discounts/student",
        studentDiscountForm.id ? "PUT" : "POST",
        studentDiscountForm as unknown as Record<string, unknown>
      );
      setStudentDiscountForm({ id: 0, studentId: "", discountId: 0, startDate: "", endDate: "", active: true });
      showMessage(studentDiscountForm.id ? "Student discount updated." : "Student discount saved.");
    } catch (err) {
      showMessage(err instanceof Error ? err.message : "Failed to save student discount.", "error");
    } finally {
      setSavingKey(null);
    }
  };

  const handleSaveFineRule = async () => {
    if (fineRuleForm.daysFrom < 0) { showMessage("Please enter a valid 'From' day.", "error"); return; }
    if (fineRuleForm.daysTo <= 0) { showMessage("Please enter a valid 'To' day.", "error"); return; }
    if (!fineRuleForm.value || parseFloat(fineRuleForm.value) <= 0) { showMessage("Please enter a valid fine amount.", "error"); return; }
    setSavingKey("fineRule");
    try {
      await saveEntity(
        fineRuleForm.id ? `/api/fees/fines/${fineRuleForm.id}` : "/api/fees/fines",
        fineRuleForm.id ? "PUT" : "POST",
        fineRuleForm as unknown as Record<string, unknown>
      );
      setFineRuleForm({ id: 0, daysFrom: 0, daysTo: 0, fineType: "PER_DAY", value: "", active: true });
      showMessage(fineRuleForm.id ? "Fine rule updated." : "Fine rule saved.");
    } catch (err) {
      showMessage(err instanceof Error ? err.message : "Failed to save fine rule.", "error");
    } finally {
      setSavingKey(null);
    }
  };

  const filteredDues = useMemo(() => {
    setDuesPage(1);
    const nameLower = dueFilters.name.trim().toLowerCase();
    const rollFilter = dueFilters.rollNumber.trim();
    // Scope dues to students visible in the top-level class filter
    const visibleStudentIds = new Set(students.map((s) => s.id));
    return feeDues.filter((due) => {
      if (!visibleStudentIds.has(due.studentId)) return false;
      if (dueFilters.studentId && due.studentId !== dueFilters.studentId) return false;
      if (dueFilters.status !== "all" && due.status !== dueFilters.status) return false;
      if (nameLower) {
        const studentName = (studentMap.get(due.studentId)?.name ?? "").toLowerCase();
        if (!studentName.includes(nameLower)) return false;
      }
      if (rollFilter) {
        const studentRoll = studentMap.get(due.studentId)?.rollNumber ?? "";
        if (!studentRoll.includes(rollFilter)) return false;
      }
      if (dueFilters.month) {
        if (!due.dueDate.startsWith(dueFilters.month)) return false;
      }
      return true;
    });
  }, [feeDues, dueFilters, studentMap, students]);

  const filteredPayments = useMemo(() => {
    setPaymentsPage(1);
    const nameLower = paymentFilters.name.trim().toLowerCase();
    const rollFilter = paymentFilters.rollNumber.trim();
    // Scope payments to students visible in the top-level class filter
    const visibleStudentIds = new Set(students.map((s) => s.id));
    return payments.filter((payment) => {
      if (!visibleStudentIds.has(payment.studentId)) return false;
      if (nameLower) {
        const studentName = (studentMap.get(payment.studentId)?.name ?? "").toLowerCase();
        if (!studentName.includes(nameLower)) return false;
      }
      if (rollFilter) {
        const studentRoll = studentMap.get(payment.studentId)?.rollNumber ?? "";
        if (!studentRoll.includes(rollFilter)) return false;
      }
      if (paymentFilters.month) {
        if (!payment.paymentDate.startsWith(paymentFilters.month)) return false;
      }
      return true;
    });
  }, [payments, paymentFilters, studentMap, students]);

  const paymentsPageCount = Math.max(1, Math.ceil(filteredPayments.length / PAGE_SIZE));
  const paymentsPageSlice = useMemo(
    () => filteredPayments.slice((paymentsPage - 1) * PAGE_SIZE, paymentsPage * PAGE_SIZE),
    [filteredPayments, paymentsPage]
  );

  const filteredDuesWithReset = useMemo(() => {
    setDuesPage(1);
    return filteredDues;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dueFilters]);

  const duesPageCount = Math.max(1, Math.ceil(filteredDues.length / PAGE_SIZE));
  const duesPageSlice = useMemo(
    () => filteredDues.slice((duesPage - 1) * PAGE_SIZE, duesPage * PAGE_SIZE),
    [filteredDues, duesPage]
  );

  // Dues for the student currently selected in the payment form
  const studentPendingDues = useMemo(() => {
    if (!paymentForm.studentId) return [];
    return feeDues.filter(
      (due) => due.studentId === paymentForm.studentId && due.status !== "PAID"
    );
  }, [feeDues, paymentForm.studentId]);

  const studentTotalRemaining = useMemo(() => {
    return studentPendingDues
      .reduce((sum, due) => sum + parseFloat(due.remainingAmount || "0"), 0)
      .toFixed(2);
  }, [studentPendingDues]);

  // Compute net amount after applicable discounts (mirrors backend logic)
  const studentNetAfterDiscount = useMemo(() => {
    if (!paymentForm.studentId || studentPendingDues.length === 0) return studentTotalRemaining;
    const today = paymentForm.paymentDate || new Date().toISOString().slice(0, 10);
    const activeDefaults = defaultDiscounts.filter((d) => d.active);
    const studentSpecific = studentDiscounts
      .filter((sd) => sd.active && sd.studentId === paymentForm.studentId && sd.startDate <= today && sd.endDate >= today)
      .map((sd) => defaultDiscounts.find((d) => d.id === sd.discountId))
      .filter(Boolean) as DefaultDiscount[];

    let totalNet = 0;
    for (const due of studentPendingDues) {
      const remaining = parseFloat(due.remainingAmount || "0");
      let discount = 0;
      const isApplicable = (applicableOn: string) => {
        if (applicableOn === "ALL") return true;
        if (applicableOn === "TUITION") return (feeTypeMap.get(due.feeTypeId)?.name ?? "").toLowerCase().includes("tuition") || (feeTypeMap.get(due.feeTypeId)?.name ?? "").toLowerCase().includes("tution");
        if (applicableOn === "TRANSPORT") return (feeTypeMap.get(due.feeTypeId)?.name ?? "").toLowerCase().includes("transport");
        return Number(applicableOn) === due.feeTypeId;
      };
      for (const def of activeDefaults) {
        if (!isApplicable(def.applicableOn)) continue;
        if (def.discountType === "PERCENTAGE") {
          discount += remaining * parseFloat(def.value) / 100;
        } else {
          discount += parseFloat(def.value);
        }
      }
      for (const def of studentSpecific) {
        if (!isApplicable(def.applicableOn)) continue;
        if (def.discountType === "PERCENTAGE") {
          discount += remaining * parseFloat(def.value) / 100;
        } else {
          discount += parseFloat(def.value);
        }
      }
      discount = Math.min(discount, remaining);
      totalNet += remaining - discount;
    }
    return totalNet.toFixed(2);
  }, [studentPendingDues, defaultDiscounts, studentDiscounts, paymentForm.studentId, paymentForm.paymentDate, feeTypeMap, studentTotalRemaining]);

  // Group pending dues by calendar month, sorted chronologically
  const duesByMonth = useMemo(() => {
    const map = new Map<string, { label: string; dues: typeof studentPendingDues; monthTotal: string }>();
    for (const due of studentPendingDues) {
      // dueDate is "YYYY-MM-DD" — extract the "YYYY-MM" key
      const key = due.dueDate ? due.dueDate.slice(0, 7) : "Unknown";
      if (!map.has(key)) {
        // Build a readable label like "April 2026"
        let label = key;
        try {
          const [year, month] = key.split("-");
          label = new Date(Number(year), Number(month) - 1, 1).toLocaleString("default", {
            month: "long",
            year: "numeric",
          });
        } catch {
          // fallback to raw key
        }
        map.set(key, { label, dues: [], monthTotal: "0.00" });
      }
      map.get(key)!.dues.push(due);
    }
    // Compute per-month totals and sort months chronologically
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, group]) => ({
        ...group,
        monthTotal: group.dues
          .reduce((sum, d) => sum + parseFloat(d.remainingAmount || "0"), 0)
          .toFixed(2),
      }));
  }, [studentPendingDues]);

  return (
    <div>
      <div className={styles.tabs}>
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {isLoading || feeLoading ? (
        <div className={styles.loadingCard}>
          <div className={styles.skeletonTitle} />
          <div className={styles.skeletonLine} />
          <div className={styles.skeletonLine} />
        </div>
      ) : (
        <>
          {message ? (
            <div className={messageType === "error" ? styles.error : styles.saveMessage}>
              {message}
            </div>
          ) : null}

          {activeTab === "Fee Types" ? (
            <div className={styles.sectionCard}>
              <div className={styles.sectionTitle}>Fee Types</div>
              <div className={styles.fieldRow}>
                <label className={styles.label}>
                  Name <span style={{ color: "#dc2626" }}>*</span>
                  <input
                    className={styles.input}
                    value={feeTypeForm.name}
                    onChange={(event) =>
                      setFeeTypeForm({ ...feeTypeForm, name: event.target.value })
                    }
                  />
                </label>
                <label className={styles.label}>
                  Active <span style={{ color: "#dc2626" }}>*</span>
                  <select
                    className={styles.input}
                    value={feeTypeForm.active ? "Yes" : "No"}
                    onChange={(event) =>
                      setFeeTypeForm({ ...feeTypeForm, active: event.target.value === "Yes" })
                    }
                  >
                    <option>Yes</option>
                    <option>No</option>
                  </select>
                </label>
              </div>
              <div className={styles.formActions}>
                <button
                  className={`${styles.button} ${savingKey === "feeType" ? styles.buttonLoading : ""}`}
                  type="button"
                  disabled={savingKey === "feeType"}
                  onClick={handleSaveFeeType}
                >
                  {savingKey === "feeType"
                    ? feeTypeForm.id ? "Updating…" : "Saving…"
                    : feeTypeForm.id ? "Update Type" : "Save Type"}
                </button>
              </div>
              <div className={styles.tableResponsive}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {feeTypes.map((type, index) => (
                  <tr key={type.id}>
                    <td>{index + 1}</td>
                    <td>{type.name}</td>
                    <td>{type.active ? "Active" : "Inactive"}</td>
                    <td>
                      <button
                        className={styles.inlineButton}
                        type="button"
                        onClick={() => setFeeTypeForm(type)}
                      >
                        Edit
                      </button>
                      <button
                        className={styles.inlineButton}
                        type="button"
                        onClick={() => confirmDelete(`/api/fees/types/${type.id}`, `Fee type "${type.name}"`)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {activeTab === "Fee Structure" ? (
        <div className={styles.sectionCard}>
          <div className={styles.sectionTitle}>Fee Structure</div>
          <div className={styles.fieldRow}>
            <label className={styles.label}>
              Class <span style={{ color: "#dc2626" }}>*</span>
              {(() => {
                const classOpts = editingGroupIds.length > 0
                  ? [{ value: feeStructureForm.classCode, label: `Class ${feeStructureForm.classCode}` }]
                  : uniqueGrades.map((cls) => ({ value: cls.name, label: `Class ${cls.name}` }));
                return (
                  <select
                    className={styles.input}
                    value={feeStructureForm.classCode}
                    disabled={editingGroupIds.length > 0}
                    onChange={(event) =>
                      setFeeStructureForm({ ...feeStructureForm, classCode: event.target.value })
                    }
                  >
                    {[{ value: "", label: "Select" }, ...classOpts].map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                );
              })()}
            </label>
            <label className={styles.label}>
              Fee Type <span style={{ color: "#dc2626" }}>*</span>
              <select
                className={styles.input}
                value={feeStructureForm.feeTypeId || ""}
                disabled={editingGroupIds.length > 0}
                onChange={(event) =>
                  setFeeStructureForm({
                    ...feeStructureForm,
                    feeTypeId: Number(event.target.value),
                  })
                }
              >
                <option value="">Select</option>
                {feeTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.label}>
              Amount <span style={{ color: "#dc2626" }}>*</span>
              <input
                className={styles.input}
                type="number"
                placeholder="Enter amount"
                value={feeStructureForm.amount || ""}
                onChange={(event) =>
                  setFeeStructureForm({ ...feeStructureForm, amount: Number(event.target.value) })
                }
              />
            </label>
          </div>
          <div className={styles.fieldRow}>
            <label className={styles.label}>
              Frequency <span style={{ color: "#dc2626" }}>*</span>
              <select
                className={styles.input}
                value={feeStructureForm.frequency}
                onChange={(event) =>
                  setFeeStructureForm({
                    ...feeStructureForm,
                    frequency: event.target.value as FeeStructure["frequency"],
                  })
                }
              >
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
                <option value="ONE_TIME">One Time</option>
              </select>
            </label>
            <label className={styles.label}>
              Academic Year <span style={{ color: "#dc2626" }}>*</span>
              <select
                className={styles.input}
                value={feeStructureForm.academicYear}
                disabled={editingGroupIds.length > 0}
                onChange={(event) =>
                  setFeeStructureForm({
                    ...feeStructureForm,
                    academicYear: event.target.value,
                  })
                }
              >
                <option value="">Select</option>
                {academicYearOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </label>
            <label className={styles.label}>
              Effective From <span style={{ color: "#dc2626" }}>*</span>
              <input
                className={styles.input}
                type="date"
                value={feeStructureForm.effectiveFrom}
                onChange={(event) =>
                  setFeeStructureForm({
                    ...feeStructureForm,
                    effectiveFrom: event.target.value,
                  })
                }
              />
            </label>
            <label className={styles.label}>
              Due Day (1-28) <span style={{ color: "#dc2626" }}>*</span>
              <input
                className={styles.input}
                type="number"
                min={1}
                max={28}
                value={feeStructureForm.dueDay ?? 1}
                onChange={(event) =>
                  setFeeStructureForm({
                    ...feeStructureForm,
                    dueDay: Number(event.target.value),
                  })
                }
              />
            </label>
            <label className={styles.label}>
              Active <span style={{ color: "#dc2626" }}>*</span>
              <select
                className={styles.input}
                value={feeStructureForm.active ? "Yes" : "No"}
                onChange={(event) =>
                  setFeeStructureForm({
                    ...feeStructureForm,
                    active: event.target.value === "Yes",
                  })
                }
              >
                <option>Yes</option>
                <option>No</option>
              </select>
            </label>
          </div>
          <div className={styles.formActions}>
            <button
              className={`${styles.button} ${savingKey === "feeStructure" ? styles.buttonLoading : ""}`}
              type="button"
              disabled={savingKey === "feeStructure"}
              onClick={handleSaveFeeStructure}
            >
              {savingKey === "feeStructure"
                ? editingGroupIds.length > 0 ? "Updating…" : "Saving…"
                : editingGroupIds.length > 0 ? "Update Structure" : "Save Structure"}
            </button>
            {editingGroupIds.length > 0 && (
              <button
                className={styles.inlineButton}
                type="button"
                onClick={resetFeeStructureForm}
              >
                Cancel
              </button>
            )}
          </div>
          <div style={{ background: "#f0f4ff", border: "1px solid #c5d1f5", borderRadius: 6, padding: "10px 14px", margin: "10px 0", fontSize: 13, color: "#334", lineHeight: 1.6 }}>
            <strong>Frequency guide:</strong>
            <ul style={{ margin: "4px 0 0 18px", padding: 0 }}>
              <li><b>Monthly</b> — Dues generated every month when the effective date is on or before the selected month.</li>
              <li><b>Yearly</b> — Dues generated once per year in the month of the effective date (e.g., effective April 2026 → due every April).</li>
              <li><b>One Time</b> — Dues generated only once, fixed to the effective date. Will not repeat in any subsequent month.</li>
            </ul>
          </div>
          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Class</th>
                  <th>Fee Type</th>
                  <th>Amount</th>
                  <th>Frequency</th>
                  <th>Year</th>
                  <th>Effective</th>
                  <th>Due Day</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {groupedFeeStructures.map((group, index) => (
                  <tr
                    key={group.key}
                    style={group.memberIds.some((id) => editingGroupIds.includes(id)) ? { background: "#f0f9f0" } : undefined}
                  >
                    <td>{index + 1}</td>
                    <td>Class {group.gradeName}</td>
                    <td>{feeTypeMap.get(group.feeTypeId)?.name ?? "-"}</td>
                    <td>{group.amount}{group.inconsistent ? " *" : ""}</td>
                    <td>{group.frequency}</td>
                    <td>{group.academicYear}</td>
                    <td>{group.effectiveFrom}</td>
                    <td>{group.dueDay || "-"}</td>
                    <td>{group.active ? "Active" : "Inactive"}</td>
                    <td>
                      <button
                        className={styles.inlineButton}
                        type="button"
                        onClick={() => {
                          setEditingGroupIds(group.memberIds);
                          setFeeStructureForm({
                            id: group.memberIds[0],
                            classCode: group.gradeName,
                            feeTypeId: group.feeTypeId,
                            amount: group.amount,
                            frequency: group.frequency,
                            academicYear: group.academicYear,
                            effectiveFrom: group.effectiveFrom,
                            dueDay: group.dueDay,
                            active: group.active,
                          });
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className={styles.inlineButton}
                        type="button"
                        onClick={() =>
                          confirmDelete(
                            group.memberIds.map((id) => `/api/fees/structures/${id}`),
                            `Fee structure for Class "${group.gradeName}"`
                          )
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
        </div>
      ) : null}

      {activeTab === "Generate Dues" ? (
        <div className={styles.sectionCard}>
          <div className={styles.sectionTitle}>Generate Dues</div>
          <div className={styles.fieldRow}>
            <label className={styles.label}>
              Class <span style={{ color: "#dc2626" }}>*</span>
              <select
                className={styles.input}
                value={generateForm.classCode}
                onChange={(event) =>
                  setGenerateForm({ ...generateForm, classCode: event.target.value })
                }
              >
                <option value="">All Classes</option>
                {uniqueGrades.map((cls) => (
                  <option key={cls.name} value={cls.name}>
                    Class {cls.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.label}>
              Month <span style={{ color: "#dc2626" }}>*</span>
              <input
                className={styles.input}
                type="month"
                value={generateForm.month}
                onChange={(event) =>
                  setGenerateForm({ ...generateForm, month: event.target.value })
                }
              />
            </label>
            <label className={styles.label}>
              Academic Year <span style={{ color: "#dc2626" }}>*</span>
              <select
                className={styles.input}
                value={generateForm.academicYear}
                onChange={(event) =>
                  setGenerateForm({ ...generateForm, academicYear: event.target.value })
                }
              >
                <option value="">Select</option>
                {academicYearOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </label>
          </div>
          <div className={styles.formActions}>
            <button
              className={`${styles.button} ${savingKey === "generateDues" ? styles.buttonLoading : ""}`}
              type="button"
              disabled={savingKey === "generateDues" || savingKey === "regenerateDues"}
              onClick={handleGenerateDues}
            >
              {savingKey === "generateDues" ? "Generating…" : "Generate Dues"}
            </button>
            <button
              className={`${styles.button} ${savingKey === "regenerateDues" ? styles.buttonLoading : ""}`}
              type="button"
              disabled={savingKey === "generateDues" || savingKey === "regenerateDues"}
              onClick={handleRegenerateDues}
            >
              {savingKey === "regenerateDues" ? "Regenerating…" : "Regenerate Dues (Unpaid Only)"}
            </button>
          </div>

          {/* Info: which fee structures will apply for the selected class + month */}
          {generateForm.month && (() => {
            const monthStart = generateForm.month + "-01";
            const selectedGrade = generateForm.classCode;
            // Resolve grade to classCodes
            const targetCodes = selectedGrade
              ? classOptions.filter((c) => c.name === selectedGrade).map((c) => c.classCode)
              : classOptions.map((c) => c.classCode);
            // Gather all active structures matching the target classCodes + optional academic year
            const candidates = feeStructures.filter((s) => {
              if (!targetCodes.includes(s.classCode)) return false;
              if (!s.active) return false;
              if (generateForm.academicYear && s.academicYear !== generateForm.academicYear) return false;
              return true;
            });
            // For each feeTypeId, pick latest effectiveFrom ≤ monthStart
            const best = new Map<number, typeof candidates[0]>();
            for (const s of candidates) {
              if (!s.effectiveFrom || s.effectiveFrom > monthStart) continue;
              const cur = best.get(s.feeTypeId);
              if (!cur || s.effectiveFrom > cur.effectiveFrom) best.set(s.feeTypeId, s);
            }
            const applicable = Array.from(best.values());
            if (applicable.length === 0 && targetCodes.length > 0) {
              return (
                <div style={{ margin: "10px 0", padding: "10px 14px", background: "#fef3c7", borderRadius: 8, fontSize: 13, color: "#92400e" }}>
                  No active fee structures found for {selectedGrade ? `Class ${selectedGrade}` : "any class"} effective on or before {monthStart}.
                </div>
              );
            }
            if (applicable.length > 0) {
              return (
                <div style={{ margin: "10px 0", padding: "10px 14px", background: "#eff6ff", borderRadius: 8, fontSize: 13, color: "#1e40af" }}>
                  <strong>Applicable fee structures for {generateForm.month}:</strong>
                  <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                    {applicable.map((s) => (
                      <li key={s.feeTypeId}>
                        {feeTypeMap.get(s.feeTypeId)?.name ?? `Type #${s.feeTypeId}`} — Amount: {s.amount}, Due Day: {(s as unknown as { dueDay?: number; due_day?: number }).dueDay ?? (s as unknown as { dueDay?: number; due_day?: number }).due_day ?? "-"}, Effective: {s.effectiveFrom}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            }
            return null;
          })()}

          <div className={styles.tableSectionHeader}>
            <div className={styles.sectionTitle} style={{ borderBottom: "none", margin: 0, padding: 0 }}>Dues</div>
          </div>
          <div className={styles.fieldRow}>
            <label className={styles.label}>
              Search by Name
              <input
                className={styles.input}
                type="text"
                placeholder="Type student name…"
                value={dueFilters.name}
                onChange={(e) => setDueFilters({ ...dueFilters, name: e.target.value })}
              />
            </label>
            <label className={styles.label}>
              Filter by Roll No
              <input
                className={styles.input}
                type="text"
                placeholder="Roll number…"
                value={dueFilters.rollNumber}
                onChange={(e) => setDueFilters({ ...dueFilters, rollNumber: e.target.value })}
              />
            </label>
            <label className={styles.label}>
              Filter by Month
              <input
                className={styles.input}
                type="month"
                value={dueFilters.month}
                onChange={(e) => setDueFilters({ ...dueFilters, month: e.target.value })}
              />
            </label>
            <label className={styles.label}>
              Status
              <select
                className={styles.input}
                value={dueFilters.status}
                onChange={(event) => setDueFilters({ ...dueFilters, status: event.target.value })}
              >
                <option value="all">All</option>
                <option value="UNPAID">Unpaid</option>
                <option value="PARTIAL">Partial</option>
                <option value="PAID">Paid</option>
              </select>
            </label>
            {(dueFilters.name || dueFilters.rollNumber || dueFilters.month || dueFilters.status !== "all") && (
              <button
                className={styles.buttonSecondary}
                type="button"
                onClick={() => setDueFilters({ studentId: "", status: "all", name: "", month: "", rollNumber: "" })}
                style={{ alignSelf: "flex-start" }}
              >
                Clear Filters
              </button>
            )}
          </div>

          <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "8px" }}>
            Showing {Math.min((duesPage - 1) * PAGE_SIZE + 1, filteredDues.length)}–{Math.min(duesPage * PAGE_SIZE, filteredDues.length)} of {filteredDues.length} due{filteredDues.length !== 1 ? "s" : ""}
          </div>

          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Roll No</th>
                  <th>Student</th>
                  <th>Fee Type</th>
                  <th>Amount</th>
                  <th>Remaining</th>
                  <th>Due Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {duesPageSlice.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: "center", color: "#94a3b8", padding: "24px" }}>No dues found.</td></tr>
                ) : (
                  duesPageSlice.map((due) => {
                    const s = studentMap.get(due.studentId);
                    return (
                    <tr key={due.id}>
                      <td>{s?.rollNumber ?? "—"}</td>
                      <td>
                        {s ? (
                            <button
                              type="button"
                              className={styles.rowClickable}
                              onClick={() => setViewingStudent(s)}
                            >
                              {s.name}
                            </button>
                          ) : (due.studentId)}
                      </td>
                      <td>{feeTypeMap.get(due.feeTypeId)?.name ?? "-"}</td>
                      <td>₹ {parseFloat(due.amount).toFixed(2)}</td>
                      <td>₹ {parseFloat(due.remainingAmount).toFixed(2)}</td>
                      <td>{due.dueDate}</td>
                      <td>
                        <span className={
                          due.status === "UNPAID" ? styles.badgeUnpaid :
                          due.status === "PARTIAL" ? styles.badgePartial :
                          styles.badgePaid
                        }>
                          {due.status}
                        </span>
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {duesPageCount > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                disabled={duesPage === 1}
                onClick={() => setDuesPage(1)}
              >«</button>
              <button
                className={styles.pageBtn}
                disabled={duesPage === 1}
                onClick={() => setDuesPage((p) => p - 1)}
              >‹</button>
              {Array.from({ length: duesPageCount }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === duesPageCount || Math.abs(p - duesPage) <= 2)
                .reduce<(number | "…")[]>((acc, p, i, arr) => {
                  if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === "…" ? (
                    <span key={`ellipsis-${i}`} className={styles.pageEllipsis}>…</span>
                  ) : (
                    <button
                      key={p}
                      className={`${styles.pageBtn} ${duesPage === p ? styles.pageBtnActive : ""}`}
                      onClick={() => setDuesPage(p as number)}
                    >{p}</button>
                  )
                )}
              <button
                className={styles.pageBtn}
                disabled={duesPage === duesPageCount}
                onClick={() => setDuesPage((p) => p + 1)}
              >›</button>
              <button
                className={styles.pageBtn}
                disabled={duesPage === duesPageCount}
                onClick={() => setDuesPage(duesPageCount)}
              >»</button>
            </div>
          )}
        </div>
      ) : null}

      {activeTab === "Payments" ? (
        <div className={styles.sectionCard}>
          <div className={styles.sectionTitle}>Record Payment</div>

          {/* Row 1: Class filter + Student picker */}
          <div className={styles.fieldRow}>
            <label className={styles.label}>
              Class <span style={{ color: "#dc2626" }}>*</span>
              <select
                className={styles.input}
                value={paymentClassFilter}
                onChange={(event) => {
                  setPaymentClassFilter(event.target.value);
                  setPaymentForm({ ...paymentForm, studentId: "", paidAmount: "" });
                }}
              >
                <option value="">All Classes</option>
                {classOptions.map((cls) => (
                  <option key={cls.classCode} value={cls.classCode}>
                    {cls.classCode}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.label}>
              Student <span style={{ color: "#dc2626" }}>*</span>
              <select
                className={styles.input}
                value={paymentForm.studentId}
                onChange={(event) =>
                  setPaymentForm({ ...paymentForm, studentId: event.target.value, paidAmount: "" })
                }
              >
                <option value="">Select student</option>
                {(paymentClassFilter
                  ? (feeStudents.length ? feeStudents : students).filter((s) => s.classCode === paymentClassFilter)
                  : (feeStudents.length ? feeStudents : students)
                ).map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} (Roll: {student.rollNumber})
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Due summary — shown once a student is selected */}
          {paymentForm.studentId ? (
            studentPendingDues.length === 0 ? (
              <div className={styles.dueSummaryEmpty}>
                ✓ No outstanding dues for this student.
              </div>
            ) : (
              <div className={styles.dueSummaryCard}>
                {/* Overall total + Pay All */}
                <div className={styles.dueSummaryHeader}>
                  <div>
                    <div className={styles.dueSummaryLabel}>Total Outstanding</div>
                    <div className={styles.dueSummaryTotal}>₹ {studentTotalRemaining}</div>
                    {studentNetAfterDiscount !== studentTotalRemaining && (
                      <div style={{ fontSize: 12, color: "#166534", marginTop: 2 }}>
                        After discount: <strong>₹ {studentNetAfterDiscount}</strong>
                      </div>
                    )}
                  </div>
                  <button
                    className={styles.payAllButton}
                    type="button"
                    onClick={() => setPaymentForm({ ...paymentForm, paidAmount: studentNetAfterDiscount })}
                  >
                    Pay All
                  </button>
                </div>

                {/* One block per month */}
                {duesByMonth.map((group) => {
                  const monthPaid = group.dues
                    .reduce((sum, d) => {
                      const original = parseFloat(d.amount || "0");
                      const remaining = parseFloat(d.remainingAmount || "0");
                      return sum + Math.max(original - remaining, 0);
                    }, 0)
                    .toFixed(2);
                  const hasPartial = group.dues.some((d) => d.status === "PARTIAL");
                  // Compute month net after discounts
                  const today = paymentForm.paymentDate || new Date().toISOString().slice(0, 10);
                  const activeDeftsLocal = defaultDiscounts.filter((dd) => dd.active);
                  const stuSpecLocal = studentDiscounts
                    .filter((sd) => sd.active && sd.studentId === paymentForm.studentId && sd.startDate <= today && sd.endDate >= today)
                    .map((sd) => defaultDiscounts.find((dd) => dd.id === sd.discountId))
                    .filter(Boolean) as DefaultDiscount[];
                  let monthNet = 0;
                  for (const d of group.dues) {
                    const rem = parseFloat(d.remainingAmount || "0");
                    let disc = 0;
                    const isApp = (ao: string) => {
                      if (ao === "ALL") return true;
                      if (ao === "TUITION") return (feeTypeMap.get(d.feeTypeId)?.name ?? "").toLowerCase().includes("tuition") || (feeTypeMap.get(d.feeTypeId)?.name ?? "").toLowerCase().includes("tution");
                      if (ao === "TRANSPORT") return (feeTypeMap.get(d.feeTypeId)?.name ?? "").toLowerCase().includes("transport");
                      return Number(ao) === d.feeTypeId;
                    };
                    for (const df of activeDeftsLocal) { if (!isApp(df.applicableOn)) continue; disc += df.discountType === "PERCENTAGE" ? rem * parseFloat(df.value) / 100 : parseFloat(df.value); }
                    for (const df of stuSpecLocal) { if (!isApp(df.applicableOn)) continue; disc += df.discountType === "PERCENTAGE" ? rem * parseFloat(df.value) / 100 : parseFloat(df.value); }
                    monthNet += rem - Math.min(disc, rem);
                  }
                  const monthNetStr = monthNet.toFixed(2);
                  return (
                  <div key={group.label} className={styles.monthGroup}>
                    <div className={styles.monthGroupHeader}>
                      <div>
                        <span className={styles.monthGroupLabel}>{group.label}</span>
                        {hasPartial && parseFloat(monthPaid) > 0 && (
                          <span className={styles.monthPaidNote}>
                            ₹ {monthPaid} already paid
                          </span>
                        )}
                      </div>
                      <div className={styles.monthGroupActions}>
                        <span className={styles.monthGroupTotal}>
                          ₹ {monthNetStr !== group.monthTotal ? monthNetStr : group.monthTotal}
                          <span className={styles.monthGroupTotalLabel}> remaining</span>
                        </span>
                        <button
                          className={styles.payMonthButton}
                          type="button"
                          onClick={() => setPaymentForm({ ...paymentForm, paidAmount: monthNetStr })}
                        >
                          Pay remaining
                        </button>
                      </div>
                    </div>
                    <div className={styles.tableResponsive}>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th>Fee Type</th>
                            <th>Due Date</th>
                            <th>Original</th>
                            <th>Already Paid</th>
                            <th>Remaining</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.dues.map((due) => {
                            const original = parseFloat(due.amount || "0");
                            const remaining = parseFloat(due.remainingAmount || "0");
                            const alreadyPaid = Math.max(original - remaining, 0).toFixed(2);
                            return (
                            <tr key={due.id}>
                              <td>{feeTypeMap.get(due.feeTypeId)?.name ?? `Type ${due.feeTypeId}`}</td>
                              <td>{due.dueDate}</td>
                              <td>₹ {original.toFixed(2)}</td>
                              <td>
                                {parseFloat(alreadyPaid) > 0 ? (
                                  <span className={styles.paidAmountCell}>₹ {alreadyPaid}</span>
                                ) : (
                                  <span className={styles.nilCell}>—</span>
                                )}
                              </td>
                              <td>₹ {remaining.toFixed(2)}</td>
                              <td>
                                <span className={
                                  due.status === "UNPAID" ? styles.badgeUnpaid :
                                  due.status === "PARTIAL" ? styles.badgePartial :
                                  styles.badgePaid
                                }>
                                  {due.status}
                                </span>
                              </td>
                            </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  );
                })}
              </div>
            )
          ) : null}

          {/* Applicable discounts info */}
          {paymentForm.studentId && studentPendingDues.length > 0 && (() => {
            const activeDefaults = defaultDiscounts.filter((d) => d.active);
            const studentSpecific = studentDiscounts.filter(
              (sd) => sd.active && sd.studentId === paymentForm.studentId
            );
            const today = new Date().toISOString().slice(0, 10);
            const applicableStudentDiscounts = studentSpecific
              .filter((sd) => sd.startDate <= today && sd.endDate >= today)
              .map((sd) => {
                const def = defaultDiscounts.find((d) => d.id === sd.discountId);
                return def ? { ...def, studentSpecific: true, startDate: sd.startDate, endDate: sd.endDate } : null;
              })
              .filter(Boolean) as (DefaultDiscount & { studentSpecific: boolean; startDate: string; endDate: string })[];

            if (activeDefaults.length === 0 && applicableStudentDiscounts.length === 0) return null;

            return (
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, padding: "10px 14px", margin: "10px 0", fontSize: 13, color: "#14532d", lineHeight: 1.6 }}>
                <strong>Applicable discounts:</strong>
                <ul style={{ margin: "4px 0 0 18px", padding: 0 }}>
                  {activeDefaults.map((d) => (
                    <li key={`def-${d.id}`}>
                      {d.name} — {d.discountType === "PERCENTAGE" ? `${d.value}%` : `₹${d.value}`} on {d.applicableOn === "ALL" ? "All Fee Types" : (feeTypeMap.get(Number(d.applicableOn))?.name ?? d.applicableOn)}
                    </li>
                  ))}
                  {applicableStudentDiscounts.map((d) => (
                    <li key={`stu-${d.id}`}>
                      {d.name} — {d.discountType === "PERCENTAGE" ? `${d.value}%` : `₹${d.value}`} on {d.applicableOn === "ALL" ? "All Fee Types" : (feeTypeMap.get(Number(d.applicableOn))?.name ?? d.applicableOn)} <span style={{ color: "#64748b", fontSize: 11 }}>(Student-specific, {d.startDate} to {d.endDate})</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })()}

          {/* How Payments Work info toggle */}
          <div style={{ margin: "10px 0" }}>
            <button
              type="button"
              onClick={() => setShowPaymentInfo(!showPaymentInfo)}
              style={{ background: "none", border: "1px solid #cbd5e1", borderRadius: 6, padding: "5px 14px", fontSize: 13, color: "#334155", cursor: "pointer" }}
            >
              {showPaymentInfo ? "Hide" : "How Payments Work"} <span style={{ fontSize: 11 }}>{showPaymentInfo ? "▲" : "▼"}</span>
            </button>
            {showPaymentInfo && (
              <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 6, padding: "12px 16px", marginTop: 8, fontSize: 13, color: "#0c4a6e", lineHeight: 1.7 }}>
                <strong>Payment Allocation</strong>
                <ul style={{ margin: "4px 0 0 18px", padding: 0 }}>
                  <li>Payments are automatically allocated to the <strong>oldest unpaid dues first</strong> (earliest due date).</li>
                  <li>If the paid amount is less than the oldest due, that due becomes <strong>PARTIAL</strong> and the remaining dues stay UNPAID.</li>
                  <li>If the paid amount covers the oldest due fully, it moves to the next due, and so on until the amount is exhausted.</li>
                  <li>You cannot select a specific fee type to pay — the system always settles dues in chronological order.</li>
                </ul>
                <strong style={{ marginTop: 8, display: "inline-block" }}>Discounts &amp; Fines</strong>
                <ul style={{ margin: "4px 0 0 18px", padding: 0 }}>
                  <li>Active discounts (global + student-specific) are applied automatically on each due before allocating payment.</li>
                  <li>Late payment fines are calculated based on the number of days past the due date and added to the due amount.</li>
                  <li>Extra discount (one-time) can be entered manually in the field below and is applied across dues until exhausted.</li>
                </ul>
              </div>
            )}
          </div>

          {/* Row 2: Amount, date, mode */}
          <div className={styles.fieldRow}>
            <label className={styles.label}>
              Paid Amount <span style={{ color: "#dc2626" }}>*</span>
              <input
                className={styles.input}
                type="number"
                placeholder="Enter amount"
                value={paymentForm.paidAmount}
                onChange={(event) =>
                  setPaymentForm({ ...paymentForm, paidAmount: event.target.value })
                }
              />
            </label>
            <label className={styles.label}>
              Payment Date <span style={{ color: "#dc2626" }}>*</span>
              <input
                className={styles.input}
                type="date"
                value={paymentForm.paymentDate}
                onChange={(event) =>
                  setPaymentForm({ ...paymentForm, paymentDate: event.target.value })
                }
              />
            </label>
            <label className={styles.label}>
              Mode <span style={{ color: "#dc2626" }}>*</span>
              <select
                className={styles.input}
                value={paymentForm.paymentMode}
                onChange={(event) =>
                  setPaymentForm({ ...paymentForm, paymentMode: event.target.value })
                }
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Bank">Bank</option>
              </select>
            </label>
          </div>

          {/* Row 3: Extra discount fields */}
          <div className={styles.fieldRow}>
            <label className={styles.label}>
              Extra Discount
              <input
                className={styles.input}
                type="number"
                value={paymentForm.extraDiscount}
                onChange={(event) =>
                  setPaymentForm({ ...paymentForm, extraDiscount: event.target.value })
                }
              />
            </label>
            <label className={styles.label}>
              Extra Discount Reason
              <input
                className={styles.input}
                value={paymentForm.extraDiscountReason}
                onChange={(event) =>
                  setPaymentForm({ ...paymentForm, extraDiscountReason: event.target.value })
                }
              />
            </label>
            <label className={styles.label}>
              Approved By
              <input
                className={styles.input}
                value={paymentForm.approvedBy}
                onChange={(event) =>
                  setPaymentForm({ ...paymentForm, approvedBy: event.target.value })
                }
              />
            </label>
          </div>

          <div className={styles.formActions}>
            <button
              className={`${styles.button} ${savingKey === "payment" ? styles.buttonLoading : ""}`}
              type="button"
              disabled={savingKey === "payment" || studentPendingDues.length === 0}
              onClick={handlePayment}
            >
              {savingKey === "payment" ? "Recording…" : "Record Payment"}
            </button>
          </div>

          <div className={styles.tableSectionHeader}>
            <div className={styles.sectionTitle} style={{ borderBottom: "none", margin: 0, padding: 0 }}>Payment History</div>
          </div>

          {/* Filter bar */}
          <div className={styles.fieldRow}>
            <label className={styles.label}>
              Search by Name
              <input
                className={styles.input}
                type="text"
                placeholder="Type student name…"
                value={paymentFilters.name}
                onChange={(e) => setPaymentFilters({ ...paymentFilters, name: e.target.value })}
              />
            </label>
            <label className={styles.label}>
              Filter by Roll No
              <input
                className={styles.input}
                type="text"
                placeholder="Roll number…"
                value={paymentFilters.rollNumber}
                onChange={(e) => setPaymentFilters({ ...paymentFilters, rollNumber: e.target.value })}
              />
            </label>
            <label className={styles.label}>
              Filter by Month
              <input
                className={styles.input}
                type="month"
                value={paymentFilters.month}
                onChange={(e) => setPaymentFilters({ ...paymentFilters, month: e.target.value })}
              />
            </label>
            {(paymentFilters.name || paymentFilters.rollNumber || paymentFilters.month) && (
              <button
                className={styles.buttonSecondary}
                type="button"
                onClick={() => setPaymentFilters({ name: "", month: "", rollNumber: "" })}
                style={{ alignSelf: "flex-start" }}
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Result count */}
          <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "8px" }}>
            Showing {filteredPayments.length === 0 ? 0 : Math.min((paymentsPage - 1) * PAGE_SIZE + 1, filteredPayments.length)}–{Math.min(paymentsPage * PAGE_SIZE, filteredPayments.length)} of {filteredPayments.length} payment{filteredPayments.length !== 1 ? "s" : ""}
          </div>

          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Roll No</th>
                  <th>Student</th>
                  <th>Paid</th>
                  <th>Final</th>
                  <th>Default Disc</th>
                  <th>Extra Disc</th>
                  <th>Fine</th>
                  <th>Date</th>
                  <th>Mode</th>
                  <th>Receipt</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {paymentsPageSlice.length === 0 ? (
                  <tr>
                    <td colSpan={11} style={{ textAlign: "center", color: "#94a3b8", padding: "24px" }}>
                      No payments match the current filters.
                    </td>
                  </tr>
                ) : (
                  paymentsPageSlice.map((payment) => {
                    const s = studentMap.get(payment.studentId);
                    return (
                    <tr key={payment.id}>
                      <td>{s?.rollNumber ?? "—"}</td>
                      <td>
                        {s ? (
                            <button
                              type="button"
                              className={styles.rowClickable}
                              onClick={() => setViewingStudent(s)}
                            >
                              {s.name}
                            </button>
                          ) : (payment.studentId)}
                      </td>
                      <td>₹ {parseFloat(payment.paidAmount).toFixed(2)}</td>
                      <td>₹ {parseFloat(payment.finalAmount).toFixed(2)}</td>
                      <td>₹ {parseFloat(payment.totalDefaultDiscount).toFixed(2)}</td>
                      <td>₹ {parseFloat(payment.totalExtraDiscount).toFixed(2)}</td>
                      <td>₹ {parseFloat(payment.totalFine).toFixed(2)}</td>
                      <td>{payment.paymentDate}</td>
                      <td>{payment.paymentMode}</td>
                      <td>{payment.receiptNumber ?? "-"}</td>
                      <td>
                        <button
                          className={styles.inlineButton}
                          type="button"
                          onClick={() => openReceipt(payment)}
                        >
                          View Receipt
                        </button>
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {paymentsPageCount > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                disabled={paymentsPage === 1}
                onClick={() => setPaymentsPage(1)}
              >«</button>
              <button
                className={styles.pageBtn}
                disabled={paymentsPage === 1}
                onClick={() => setPaymentsPage((p) => p - 1)}
              >‹</button>
              {Array.from({ length: paymentsPageCount }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === paymentsPageCount || Math.abs(p - paymentsPage) <= 2)
                .reduce<(number | "…")[]>((acc, p, i, arr) => {
                  if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === "…" ? (
                    <span key={`ellipsis-${i}`} className={styles.pageEllipsis}>…</span>
                  ) : (
                    <button
                      key={p}
                      className={`${styles.pageBtn} ${paymentsPage === p ? styles.pageBtnActive : ""}`}
                      onClick={() => setPaymentsPage(p as number)}
                    >{p}</button>
                  )
                )}
              <button
                className={styles.pageBtn}
                disabled={paymentsPage === paymentsPageCount}
                onClick={() => setPaymentsPage((p) => p + 1)}
              >›</button>
              <button
                className={styles.pageBtn}
                disabled={paymentsPage === paymentsPageCount}
                onClick={() => setPaymentsPage(paymentsPageCount)}
              >»</button>
            </div>
          )}
        </div>
      ) : null}

      {activeTab === "Discounts & Fines" ? (
        <div className={styles.sectionCard}>
          <div style={{ marginBottom: 12 }}>
            <button
              type="button"
              onClick={() => setShowDiscountInfo(!showDiscountInfo)}
              style={{
                background: "none",
                border: "1px solid #c5d1f5",
                borderRadius: 6,
                padding: "6px 14px",
                fontSize: 13,
                color: "#3b5bdb",
                cursor: "pointer",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {showDiscountInfo ? "Hide" : "Understand Discounts"} <span style={{ fontSize: 11 }}>{showDiscountInfo ? "▲" : "▼"}</span>
            </button>
            {showDiscountInfo && (
              <div style={{ background: "#f0f4ff", border: "1px solid #c5d1f5", borderRadius: 6, padding: "10px 14px", marginTop: 8, fontSize: 13, color: "#334", lineHeight: 1.7 }}>
                <strong>How discounts work:</strong>
                <ul style={{ margin: "4px 0 0 18px", padding: 0 }}>
                  <li><b>Discounts Type (Global)</b> — These apply <b>automatically to all students</b> when recording a payment. Set the fee type it applies to, type (percentage or fixed), and value.</li>
                  <li><b>Student Discounts (Student-Specific)</b> — Assign an existing discount to a <b>specific student</b> for a date range. The discount only applies if the payment date falls within the start/end dates.</li>
                  <li><b>Stacking</b> — Both global and student-specific discounts are applied together. The total discount is capped at the due amount.</li>
                  <li><b>Tip</b> — To create a discount only for specific students, set Active to <b>No</b> in Discounts Type (so it won&#39;t apply globally), then assign it to individual students via Student Discounts.</li>
                </ul>
              </div>
            )}
          </div>
          <div className={styles.sectionTitle}>Discounts Type</div>
          <div className={styles.fieldRow}>
            <label className={styles.label}>
              Name <span style={{ color: "#dc2626" }}>*</span>
              <input
                className={styles.input}
                value={defaultDiscountForm.name}
                onChange={(event) =>
                  setDefaultDiscountForm({ ...defaultDiscountForm, name: event.target.value })
                }
              />
            </label>
            <label className={styles.label}>
              Type <span style={{ color: "#dc2626" }}>*</span>
              <select
                className={styles.input}
                value={defaultDiscountForm.discountType}
                onChange={(event) =>
                  setDefaultDiscountForm({
                    ...defaultDiscountForm,
                    discountType: event.target.value as DefaultDiscount["discountType"],
                  })
                }
              >
                <option value="PERCENTAGE">Percentage</option>
                <option value="FIXED">Fixed</option>
              </select>
            </label>
            <label className={styles.label}>
              Value <span style={{ color: "#dc2626" }}>*</span>
              <input
                className={styles.input}
                type="number"
                value={defaultDiscountForm.value}
                onChange={(event) =>
                  setDefaultDiscountForm({ ...defaultDiscountForm, value: event.target.value })
                }
              />
            </label>
          </div>
          <div className={styles.fieldRow}>
            <label className={styles.label}>
              Applicable On <span style={{ color: "#dc2626" }}>*</span>
              <select
                className={styles.input}
                value={defaultDiscountForm.applicableOn}
                onChange={(event) =>
                  setDefaultDiscountForm({
                    ...defaultDiscountForm,
                    applicableOn: event.target.value,
                  })
                }
              >
                <option value="ALL">All Fee Types</option>
                {feeTypes.filter((t) => t.active).map((t) => (
                  <option key={t.id} value={String(t.id)}>{t.name}</option>
                ))}
              </select>
            </label>
            <label className={styles.label}>
              Active <span style={{ color: "#dc2626" }}>*</span>
              <select
                className={styles.input}
                value={defaultDiscountForm.active ? "Yes" : "No"}
                onChange={(event) =>
                  setDefaultDiscountForm({
                    ...defaultDiscountForm,
                    active: event.target.value === "Yes",
                  })
                }
              >
                <option>Yes</option>
                <option>No</option>
              </select>
            </label>
          </div>
          <div className={styles.formActions}>
            <button
              className={`${styles.button} ${savingKey === "defaultDiscount" ? styles.buttonLoading : ""}`}
              type="button"
              disabled={savingKey === "defaultDiscount"}
              onClick={handleSaveDefaultDiscount}
            >
              {savingKey === "defaultDiscount"
                ? defaultDiscountForm.id ? "Updating…" : "Saving…"
                : defaultDiscountForm.id ? "Update Discount" : "Save Discount"}
            </button>
          </div>

          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Value</th>
                  <th>Applies On</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {defaultDiscounts.map((discount, index) => (
                  <tr key={discount.id}>
                    <td>{index + 1}</td>
                    <td>{discount.name}</td>
                    <td>{discount.discountType}</td>
                    <td>{discount.value}</td>
                    <td>{
                      discount.applicableOn === "ALL" ? "All Fee Types"
                      : discount.applicableOn === "TUITION" ? (feeTypes.find((t) => t.name.toLowerCase().includes("tuition") || t.name.toLowerCase().includes("tution"))?.name ?? "Tuition")
                      : discount.applicableOn === "TRANSPORT" ? (feeTypes.find((t) => t.name.toLowerCase().includes("transport"))?.name ?? "Transport")
                      : (feeTypeMap.get(Number(discount.applicableOn))?.name ?? discount.applicableOn)
                    }</td>
                    <td>{discount.active ? "Active" : "Inactive"}</td>
                    <td>
                      <button
                        className={styles.inlineButton}
                        type="button"
                        onClick={() => {
                          // Migrate old enum values (TUITION/TRANSPORT) to fee type IDs
                          let applicableOn = discount.applicableOn;
                          if (applicableOn === "TUITION") {
                            const match = feeTypes.find((t) => t.name.toLowerCase().includes("tuition") || t.name.toLowerCase().includes("tution"));
                            if (match) applicableOn = String(match.id);
                          } else if (applicableOn === "TRANSPORT") {
                            const match = feeTypes.find((t) => t.name.toLowerCase().includes("transport"));
                            if (match) applicableOn = String(match.id);
                          }
                          setDefaultDiscountForm({ ...discount, applicableOn });
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className={styles.inlineButton}
                        type="button"
                        onClick={() =>
                          confirmDelete(`/api/fees/discounts/default/${discount.id}`, `Discount "${discount.name}"`)
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

          <div className={styles.sectionTitle}>Student Discounts</div>
          <div className={styles.fieldRow}>
            <label className={styles.label}>
              Student <span style={{ color: "#dc2626" }}>*</span>
              <select
                className={styles.input}
                value={studentDiscountForm.studentId}
                onChange={(event) =>
                  setStudentDiscountForm({ ...studentDiscountForm, studentId: event.target.value })
                }
              >
                <option value="">Select</option>
                {(feeStudents.length ? feeStudents : students).map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} (Roll: {student.rollNumber})
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.label}>
              Discount <span style={{ color: "#dc2626" }}>*</span>
              <select
                className={styles.input}
                value={studentDiscountForm.discountId || ""}
                onChange={(event) =>
                  setStudentDiscountForm({
                    ...studentDiscountForm,
                    discountId: Number(event.target.value),
                  })
                }
              >
                <option value="">Select</option>
                {defaultDiscounts.map((discount) => (
                  <option key={discount.id} value={discount.id}>
                    {discount.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className={styles.fieldRow}>
            <label className={styles.label}>
              Start Date <span style={{ color: "#dc2626" }}>*</span>
              <input
                className={styles.input}
                type="date"
                value={studentDiscountForm.startDate}
                onChange={(event) =>
                  setStudentDiscountForm({ ...studentDiscountForm, startDate: event.target.value })
                }
              />
            </label>
            <label className={styles.label}>
              End Date <span style={{ color: "#dc2626" }}>*</span>
              <input
                className={styles.input}
                type="date"
                value={studentDiscountForm.endDate}
                onChange={(event) =>
                  setStudentDiscountForm({ ...studentDiscountForm, endDate: event.target.value })
                }
              />
            </label>
            <label className={styles.label}>
              Active <span style={{ color: "#dc2626" }}>*</span>
              <select
                className={styles.input}
                value={studentDiscountForm.active ? "Yes" : "No"}
                onChange={(event) =>
                  setStudentDiscountForm({
                    ...studentDiscountForm,
                    active: event.target.value === "Yes",
                  })
                }
              >
                <option>Yes</option>
                <option>No</option>
              </select>
            </label>
          </div>
          <div className={styles.formActions}>
            <button
              className={`${styles.button} ${savingKey === "studentDiscount" ? styles.buttonLoading : ""}`}
              type="button"
              disabled={savingKey === "studentDiscount"}
              onClick={handleSaveStudentDiscount}
            >
              {savingKey === "studentDiscount"
                ? studentDiscountForm.id ? "Updating…" : "Saving…"
                : studentDiscountForm.id ? "Update Student Discount" : "Save Student Discount"}
            </button>
          </div>

          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student</th>
                  <th>Discount</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {studentDiscounts.map((discount, index) => (
                  <tr key={discount.id}>
                    <td>{index + 1}</td>
                    <td>{studentMap.get(discount.studentId)?.name ?? discount.studentId}</td>
                    <td>{defaultDiscounts.find((d) => d.id === discount.discountId)?.name ?? "-"}</td>
                    <td>{discount.startDate}</td>
                    <td>{discount.endDate}</td>
                    <td>{discount.active ? "Active" : "Inactive"}</td>
                    <td>
                      <button
                        className={styles.inlineButton}
                        type="button"
                        onClick={() => setStudentDiscountForm(discount)}
                      >
                        Edit
                      </button>
                      <button
                        className={styles.inlineButton}
                        type="button"
                        onClick={() =>
                          confirmDelete(`/api/fees/discounts/student/${discount.id}`, "Student discount")
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
          <div className={styles.sectionTitle}>Fine Rules</div>
          <div className={styles.fieldRow}>
            <label className={styles.label}>
              From (delay in days) <span style={{ color: "#dc2626" }}>*</span>
              <input
                className={styles.input}
                type="number"
                min={0}
                placeholder="e.g. 1"
                value={fineRuleForm.daysFrom}
                onChange={(event) =>
                  setFineRuleForm({ ...fineRuleForm, daysFrom: Number(event.target.value) })
                }
              />
            </label>
            <label className={styles.label}>
              To (delay in days) <span style={{ color: "#dc2626" }}>*</span>
              <input
                className={styles.input}
                type="number"
                min={0}
                placeholder="e.g. 7"
                value={fineRuleForm.daysTo}
                onChange={(event) =>
                  setFineRuleForm({ ...fineRuleForm, daysTo: Number(event.target.value) })
                }
              />
            </label>
            <label className={styles.label}>
              Fine Type <span style={{ color: "#dc2626" }}>*</span>
              <select
                className={styles.input}
                value={fineRuleForm.fineType}
                onChange={(event) =>
                  setFineRuleForm({
                    ...fineRuleForm,
                    fineType: event.target.value as FineRule["fineType"],
                  })
                }
              >
                <option value="PER_DAY">Per Day</option>
                <option value="FIXED">Fixed</option>
              </select>
            </label>
            <label className={styles.label}>
              Fine Amount (₹) <span style={{ color: "#dc2626" }}>*</span>
              <input
                className={styles.input}
                type="number"
                min={0}
                placeholder="e.g. 50"
                value={fineRuleForm.value}
                onChange={(event) =>
                  setFineRuleForm({ ...fineRuleForm, value: event.target.value })
                }
              />
            </label>
            <label className={styles.label}>
              Active <span style={{ color: "#dc2626" }}>*</span>
              <select
                className={styles.input}
                value={fineRuleForm.active ? "Yes" : "No"}
                onChange={(event) =>
                  setFineRuleForm({
                    ...fineRuleForm,
                    active: event.target.value === "Yes",
                  })
                }
              >
                <option>Yes</option>
                <option>No</option>
              </select>
            </label>
          </div>
          <div className={styles.formActions}>
            <button
              className={`${styles.button} ${savingKey === "fineRule" ? styles.buttonLoading : ""}`}
              type="button"
              disabled={savingKey === "fineRule"}
              onClick={handleSaveFineRule}
            >
              {savingKey === "fineRule"
                ? fineRuleForm.id ? "Updating…" : "Saving…"
                : fineRuleForm.id ? "Update Fine Rule" : "Save Fine Rule"}
            </button>
          </div>

          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Delay (in days)</th>
                  <th>Fine Type</th>
                  <th>Fine Amount (₹)</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {fineRules.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className={styles.empty}>No fine rules defined yet.</div>
                    </td>
                  </tr>
                ) : (
                  fineRules.map((rule, index) => (
                    <tr key={rule.id}>
                      <td data-label="#">{index + 1}</td>
                      <td data-label="Delay (in days)">
                        {rule.daysFrom === rule.daysTo
                          ? `${rule.daysFrom} day${rule.daysFrom !== 1 ? "s" : ""}`
                          : `${rule.daysFrom} – ${rule.daysTo} days`}
                      </td>
                      <td data-label="Fine Type">
                        <span className={rule.fineType === "PER_DAY" ? styles.badgeBlue : styles.badgeOrange}>
                          {rule.fineType === "PER_DAY" ? "Per Day" : "Fixed"}
                        </span>
                      </td>
                      <td data-label="Fine Amount (₹)">₹{rule.value}</td>
                      <td data-label="Status">
                        <span className={rule.active ? styles.badgeGreen : styles.badgeGray}>
                          {rule.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td data-label="Action">
                        <div className={styles.actionRow}>
                          <button
                            className={styles.inlineButton}
                            type="button"
                            onClick={() => setFineRuleForm(rule)}
                          >
                            Edit
                          </button>
                          <button
                            className={styles.inlineButton}
                            type="button"
                            onClick={() => confirmDelete(`/api/fees/fines/${rule.id}`, "Fine rule")}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
        </>
      )}

      {/* ── Delete Confirmation Dialog ── */}
      {deleteConfirm ? (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div className={styles.modalCard} style={{ maxWidth: 420 }}>
            <div className={styles.modalHeader}>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0f172a" }}>
                  Confirm Delete
                </h3>
                <p className={styles.modalSubtitle} style={{ marginTop: 6 }}>
                  Are you sure you want to delete <strong>{deleteConfirm.label}</strong>? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.inlineButton}
                type="button"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                style={{
                  border: "none",
                  borderRadius: 10,
                  background: "linear-gradient(135deg,#dc2626,#b91c1c)",
                  color: "#fff",
                  padding: "9px 16px",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                }}
                onClick={handleConfirmedDelete}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Student Profile Viewer ── */}
      {viewingStudent ? (
        <StudentProfileModal
          student={viewingStudent}
          onClose={() => setViewingStudent(null)}
        />
      ) : null}
    </div>
  );
}
