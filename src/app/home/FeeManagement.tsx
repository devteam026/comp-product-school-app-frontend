"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "../styles/home.module.css";
import type { Student } from "./data";
import { apiUrl } from "../../lib/api";

type FeeManagementProps = {
  students: Student[];
  isLoading?: boolean;
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
  applicableOn: "ALL" | "TUITION" | "TRANSPORT";
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
  "Discounts",
  "Fine Rules",
] as const;
type Tab = (typeof tabs)[number];

export default function FeeManagement({ students, isLoading }: FeeManagementProps) {
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
    { classCode: string; grade: string; section: string }[]
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

  const [generateForm, setGenerateForm] = useState({
    classCode: "",
    month: new Date().toISOString().slice(0, 7),
    academicYear: "",
  });

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
  });

  const [message, setMessage] = useState<string | null>(null);
  const token = typeof window !== "undefined" ? window.localStorage.getItem("authToken") : null;
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  const studentMap = useMemo(() => {
    const source = feeStudents.length ? feeStudents : students;
    return new Map(source.map((student) => [student.id, student]));
  }, [feeStudents, students]);

  const feeTypeMap = useMemo(() => {
    return new Map(feeTypes.map((type) => [type.id, type]));
  }, [feeTypes]);

  const fetchJson = async (url: string) => {
    const res = await fetch(apiUrl(url), { headers });
    if (!res.ok) return [];
    return res.json();
  };

  const loadAll = async () => {
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

  const handlePayment = async () => {
    setMessage(null);
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
      setMessage("Payment recorded.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unable to record payment";
      setMessage(msg);
    }
  };

  const openReceipt = (payment: FeePayment) => {
    const student = studentMap.get(payment.studentId);
    const detailsRows = payment.details
      .map(
        (detail) => `
        <tr>
          <td>${detail.dueId}</td>
          <td>${detail.dueAmount}</td>
          <td>${detail.defaultDiscount}</td>
          <td>${detail.extraDiscount}</td>
          <td>${detail.fineAmount}</td>
          <td>${detail.finalAmount}</td>
          <td>${detail.paidAmount}</td>
        </tr>`
      )
      .join("");
    const html = `
      <html>
        <head>
          <title>Receipt ${payment.receiptNumber ?? ""}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
            h1 { font-size: 20px; margin: 0 0 6px; }
            .meta { margin-bottom: 16px; font-size: 12px; color: #475569; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th, td { border: 1px solid #e2e8f0; padding: 8px; font-size: 12px; text-align: left; }
            th { background: #f8fafc; }
            .totals { margin-top: 16px; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>Fee Receipt</h1>
          <div class="meta">
            <div>Receipt: ${payment.receiptNumber ?? "-"}</div>
            <div>Date: ${payment.paymentDate}</div>
            <div>Student: ${student?.name ?? payment.studentId} ${
      student?.classCode ? `(${student.classCode})` : ""
    }</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Due #</th>
                <th>Due Amount</th>
                <th>Default Disc</th>
                <th>Extra Disc</th>
                <th>Fine</th>
                <th>Final</th>
                <th>Paid</th>
              </tr>
            </thead>
            <tbody>
              ${detailsRows || "<tr><td colspan='7'>No details</td></tr>"}
            </tbody>
          </table>
          <div class="totals">
            <div>Total Due: ${payment.totalDue}</div>
            <div>Total Default Discount: ${payment.totalDefaultDiscount}</div>
            <div>Total Extra Discount: ${payment.totalExtraDiscount}</div>
            <div>Total Fine: ${payment.totalFine}</div>
            <div>Final Amount: ${payment.finalAmount}</div>
            <div>Paid Amount: ${payment.paidAmount}</div>
            <div>Payment Mode: ${payment.paymentMode}</div>
          </div>
          <script>
            window.onload = () => { window.print(); };
          </script>
        </body>
      </html>`;
    const receiptWindow = window.open("", "_blank");
    if (!receiptWindow) return;
    receiptWindow.document.open();
    receiptWindow.document.write(html);
    receiptWindow.document.close();
  };

  const handleGenerateDues = async () => {
    setMessage(null);
    try {
      await saveEntity("/api/fees/dues/generate", "POST", generateForm);
      setMessage("Dues generated.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unable to generate dues";
      setMessage(msg);
    }
  };

  const handleRegenerateDues = async () => {
    setMessage(null);
    try {
      await saveEntity("/api/fees/dues/regenerate", "POST", generateForm);
      setMessage("Dues regenerated (unpaid only).");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unable to regenerate dues";
      setMessage(msg);
    }
  };

  const filteredDues = useMemo(() => {
    return feeDues.filter((due) => {
      if (dueFilters.studentId && due.studentId !== dueFilters.studentId) return false;
      if (dueFilters.status !== "all" && due.status !== dueFilters.status) return false;
      return true;
    });
  }, [feeDues, dueFilters]);

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

      {isLoading ? <div className={styles.loadingText}>Loading...</div> : null}
      {message ? <div className={styles.success}>{message}</div> : null}

      {activeTab === "Fee Types" ? (
        <div className={styles.sectionCard}>
          <div className={styles.sectionTitle}>Fee Types</div>
          <div className={styles.fieldRow}>
            <label className={styles.label}>
              Name
              <input
                className={styles.input}
                value={feeTypeForm.name}
                onChange={(event) => setFeeTypeForm({ ...feeTypeForm, name: event.target.value })}
              />
            </label>
            <label className={styles.label}>
              Active
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
          <button
            className={styles.button}
            type="button"
            onClick={() =>
              saveEntity(
                feeTypeForm.id ? `/api/fees/types/${feeTypeForm.id}` : "/api/fees/types",
                feeTypeForm.id ? "PUT" : "POST",
                feeTypeForm
              ).then(() => setFeeTypeForm({ id: 0, name: "", active: true }))
            }
          >
            {feeTypeForm.id ? "Update Type" : "Save Type"}
          </button>
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
                        onClick={() => deleteEntity(`/api/fees/types/${type.id}`)}
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
              Class
              <select
                className={styles.input}
                value={feeStructureForm.classCode}
                onChange={(event) =>
                  setFeeStructureForm({ ...feeStructureForm, classCode: event.target.value })
                }
              >
                <option value="">Select</option>
                {classOptions.map((cls) => (
                  <option key={cls.classCode} value={cls.classCode}>
                    {cls.classCode}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.label}>
              Fee Type
              <select
                className={styles.input}
                value={feeStructureForm.feeTypeId || ""}
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
              Amount
              <input
                className={styles.input}
                type="number"
                value={feeStructureForm.amount}
                onChange={(event) =>
                  setFeeStructureForm({ ...feeStructureForm, amount: Number(event.target.value) })
                }
              />
            </label>
          </div>
          <div className={styles.fieldRow}>
            <label className={styles.label}>
              Frequency
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
              Academic Year
              <input
                className={styles.input}
                value={feeStructureForm.academicYear}
                onChange={(event) =>
                  setFeeStructureForm({
                    ...feeStructureForm,
                    academicYear: event.target.value,
                  })
                }
              />
            </label>
            <label className={styles.label}>
              Effective From
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
              Due Day (1-28)
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
              Active
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
          <button
            className={styles.button}
            type="button"
            onClick={() =>
              saveEntity(
                feeStructureForm.id
                  ? `/api/fees/structures/${feeStructureForm.id}`
                  : "/api/fees/structures",
                feeStructureForm.id ? "PUT" : "POST",
                feeStructureForm
              ).then(() =>
                setFeeStructureForm({
                  id: 0,
                  classCode: "",
                  feeTypeId: 0,
                  amount: 0,
                  frequency: "MONTHLY",
                  academicYear: "",
                  effectiveFrom: "",
                  dueDay: 1,
                  active: true,
                })
              )
            }
          >
            {feeStructureForm.id ? "Update Structure" : "Save Structure"}
          </button>
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
                {feeStructures.map((structure, index) => (
                  <tr key={structure.id}>
                    <td>{index + 1}</td>
                    <td>{structure.classCode}</td>
                    <td>{feeTypeMap.get(structure.feeTypeId)?.name ?? "-"}</td>
                    <td>{structure.amount}</td>
                    <td>{structure.frequency}</td>
                    <td>{structure.academicYear}</td>
                    <td>{structure.effectiveFrom}</td>
                    <td>
                      {(structure as unknown as { dueDay?: number; due_day?: number }).dueDay ??
                        (structure as unknown as { dueDay?: number; due_day?: number }).due_day ??
                        "-"}
                    </td>
                    <td>{structure.active ? "Active" : "Inactive"}</td>
                    <td>
                      <button
                        className={styles.inlineButton}
                        type="button"
                        onClick={() =>
                          setFeeStructureForm({
                            ...structure,
                            dueDay:
                              (structure as unknown as { dueDay?: number; due_day?: number })
                                .dueDay ??
                              (structure as unknown as { dueDay?: number; due_day?: number })
                                .due_day ??
                              1,
                          })
                        }
                      >
                        Edit
                      </button>
                      <button
                        className={styles.inlineButton}
                        type="button"
                        onClick={() => deleteEntity(`/api/fees/structures/${structure.id}`)}
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
              Class
              <select
                className={styles.input}
                value={generateForm.classCode}
                onChange={(event) =>
                  setGenerateForm({ ...generateForm, classCode: event.target.value })
                }
              >
                <option value="">Select</option>
                {classOptions.map((cls) => (
                  <option key={cls.classCode} value={cls.classCode}>
                    {cls.classCode}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.label}>
              Month
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
              Academic Year
              <input
                className={styles.input}
                value={generateForm.academicYear}
                onChange={(event) =>
                  setGenerateForm({ ...generateForm, academicYear: event.target.value })
                }
              />
            </label>
          </div>
          <button className={styles.button} type="button" onClick={handleGenerateDues}>
            Generate Dues
          </button>
          <button className={styles.button} type="button" onClick={handleRegenerateDues}>
            Regenerate Dues
          </button>

          <div className={styles.sectionTitle}>Dues</div>
          <div className={styles.fieldRow}>
            <label className={styles.label}>
              Student
              <select
                className={styles.input}
                value={dueFilters.studentId}
                onChange={(event) =>
                  setDueFilters({ ...dueFilters, studentId: event.target.value })
                }
              >
                <option value="">All</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} ({student.classCode})
                  </option>
                ))}
              </select>
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
          </div>
          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student</th>
                  <th>Fee Type</th>
                  <th>Amount</th>
                  <th>Remaining</th>
                  <th>Due Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredDues.map((due, index) => (
                  <tr key={due.id}>
                    <td>{index + 1}</td>
                    <td>{studentMap.get(due.studentId)?.name ?? due.studentId}</td>
                    <td>{feeTypeMap.get(due.feeTypeId)?.name ?? "-"}</td>
                    <td>{due.amount}</td>
                    <td>{due.remainingAmount}</td>
                    <td>{due.dueDate}</td>
                    <td>{due.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {activeTab === "Payments" ? (
        <div className={styles.sectionCard}>
          <div className={styles.sectionTitle}>Record Payment</div>
          <div className={styles.fieldRow}>
            <label className={styles.label}>
              Student
              <select
                className={styles.input}
                value={paymentForm.studentId}
                onChange={(event) =>
                  setPaymentForm({ ...paymentForm, studentId: event.target.value })
                }
              >
                <option value="">Select</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} ({student.classCode})
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.label}>
              Paid Amount
              <input
                className={styles.input}
                type="number"
                value={paymentForm.paidAmount}
                onChange={(event) =>
                  setPaymentForm({ ...paymentForm, paidAmount: event.target.value })
                }
              />
            </label>
            <label className={styles.label}>
              Payment Date
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
              Mode
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
          <button className={styles.button} type="button" onClick={handlePayment}>
            Record Payment
          </button>

          <div className={styles.sectionTitle}>Payments</div>
          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
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
                {payments.map((payment, index) => (
                  <tr key={payment.id}>
                    <td>{index + 1}</td>
                    <td>{studentMap.get(payment.studentId)?.name ?? payment.studentId}</td>
                    <td>{payment.paidAmount}</td>
                    <td>{payment.finalAmount}</td>
                    <td>{payment.totalDefaultDiscount}</td>
                    <td>{payment.totalExtraDiscount}</td>
                    <td>{payment.totalFine}</td>
                    <td>{payment.paymentDate}</td>
                    <td>{payment.paymentMode}</td>
                    <td>{payment.receiptNumber ?? "-"}</td>
                    <td>
                      <button
                        className={styles.inlineButton}
                        type="button"
                        onClick={() => openReceipt(payment)}
                      >
                        Download Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {activeTab === "Discounts" ? (
        <div className={styles.sectionCard}>
          <div className={styles.sectionTitle}>Default Discounts</div>
          <div className={styles.fieldRow}>
            <label className={styles.label}>
              Name
              <input
                className={styles.input}
                value={defaultDiscountForm.name}
                onChange={(event) =>
                  setDefaultDiscountForm({ ...defaultDiscountForm, name: event.target.value })
                }
              />
            </label>
            <label className={styles.label}>
              Type
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
              Value
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
              Applicable On
              <select
                className={styles.input}
                value={defaultDiscountForm.applicableOn}
                onChange={(event) =>
                  setDefaultDiscountForm({
                    ...defaultDiscountForm,
                    applicableOn: event.target.value as DefaultDiscount["applicableOn"],
                  })
                }
              >
                <option value="ALL">All</option>
                <option value="TUITION">Tuition</option>
                <option value="TRANSPORT">Transport</option>
              </select>
            </label>
            <label className={styles.label}>
              Active
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
          <button
            className={styles.button}
            type="button"
            onClick={() =>
              saveEntity(
                defaultDiscountForm.id
                  ? `/api/fees/discounts/default/${defaultDiscountForm.id}`
                  : "/api/fees/discounts/default",
                defaultDiscountForm.id ? "PUT" : "POST",
                defaultDiscountForm
              ).then(() =>
                setDefaultDiscountForm({
                  id: 0,
                  name: "",
                  discountType: "PERCENTAGE",
                  value: "",
                  applicableOn: "ALL",
                  active: true,
                })
              )
            }
          >
            {defaultDiscountForm.id ? "Update Discount" : "Save Discount"}
          </button>

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
                    <td>{discount.applicableOn}</td>
                    <td>{discount.active ? "Active" : "Inactive"}</td>
                    <td>
                      <button
                        className={styles.inlineButton}
                        type="button"
                        onClick={() => setDefaultDiscountForm(discount)}
                      >
                        Edit
                      </button>
                      <button
                        className={styles.inlineButton}
                        type="button"
                        onClick={() =>
                          deleteEntity(`/api/fees/discounts/default/${discount.id}`)
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
              Student
              <select
                className={styles.input}
                value={studentDiscountForm.studentId}
                onChange={(event) =>
                  setStudentDiscountForm({ ...studentDiscountForm, studentId: event.target.value })
                }
              >
                <option value="">Select</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} ({student.classCode})
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.label}>
              Discount
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
              Start Date
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
              End Date
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
              Active
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
          <button
            className={styles.button}
            type="button"
            onClick={() =>
              saveEntity(
                studentDiscountForm.id
                  ? `/api/fees/discounts/student/${studentDiscountForm.id}`
                  : "/api/fees/discounts/student",
                studentDiscountForm.id ? "PUT" : "POST",
                studentDiscountForm
              ).then(() =>
                setStudentDiscountForm({
                  id: 0,
                  studentId: "",
                  discountId: 0,
                  startDate: "",
                  endDate: "",
                  active: true,
                })
              )
            }
          >
            {studentDiscountForm.id ? "Update Student Discount" : "Save Student Discount"}
          </button>

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
                          deleteEntity(`/api/fees/discounts/student/${discount.id}`)
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

      {activeTab === "Fine Rules" ? (
        <div className={styles.sectionCard}>
          <div className={styles.sectionTitle}>Fine Rules</div>
          <div className={styles.fieldRow}>
            <label className={styles.label}>
              Days From
              <input
                className={styles.input}
                type="number"
                value={fineRuleForm.daysFrom}
                onChange={(event) =>
                  setFineRuleForm({ ...fineRuleForm, daysFrom: Number(event.target.value) })
                }
              />
            </label>
            <label className={styles.label}>
              Days To
              <input
                className={styles.input}
                type="number"
                value={fineRuleForm.daysTo}
                onChange={(event) =>
                  setFineRuleForm({ ...fineRuleForm, daysTo: Number(event.target.value) })
                }
              />
            </label>
            <label className={styles.label}>
              Fine Type
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
              Value
              <input
                className={styles.input}
                type="number"
                value={fineRuleForm.value}
                onChange={(event) =>
                  setFineRuleForm({ ...fineRuleForm, value: event.target.value })
                }
              />
            </label>
            <label className={styles.label}>
              Active
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
          <button
            className={styles.button}
            type="button"
            onClick={() =>
              saveEntity(
                fineRuleForm.id ? `/api/fees/fines/${fineRuleForm.id}` : "/api/fees/fines",
                fineRuleForm.id ? "PUT" : "POST",
                fineRuleForm
              ).then(() =>
                setFineRuleForm({
                  id: 0,
                  daysFrom: 0,
                  daysTo: 0,
                  fineType: "PER_DAY",
                  value: "",
                  active: true,
                })
              )
            }
          >
            {fineRuleForm.id ? "Update Fine Rule" : "Save Fine Rule"}
          </button>

          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Type</th>
                  <th>Value</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {fineRules.map((rule, index) => (
                  <tr key={rule.id}>
                    <td>{index + 1}</td>
                    <td>{rule.daysFrom}</td>
                    <td>{rule.daysTo}</td>
                    <td>{rule.fineType}</td>
                    <td>{rule.value}</td>
                    <td>{rule.active ? "Active" : "Inactive"}</td>
                    <td>
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
                        onClick={() => deleteEntity(`/api/fees/fines/${rule.id}`)}
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
    </div>
  );
}
