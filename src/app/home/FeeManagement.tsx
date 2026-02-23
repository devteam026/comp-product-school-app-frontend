"use client";

import { useMemo, useState } from "react";
import styles from "../styles/home.module.css";
import type { Student } from "./data";
import StudentProfileModal from "./StudentProfileModal";

type FeeManagementProps = {
  students: Student[];
};

type Payment = {
  id: string;
  studentId: string;
  amount: number;
  months: string[];
  method: "Cash" | "UPI" | "Bank";
  note: string;
  date: string;
};

const tabs = ["Overview", "Record Payments", "Show Payment"] as const;

type Tab = (typeof tabs)[number];

const monthlyFee = 100;
const monthlyFees = [
  { month: "Aug", paid: 820, unpaid: 210, free: 120 },
  { month: "Sep", paid: 860, unpaid: 180, free: 110 },
  { month: "Oct", paid: 900, unpaid: 170, free: 105 },
  { month: "Nov", paid: 880, unpaid: 190, free: 115 },
  { month: "Dec", paid: 890, unpaid: 350, free: 120 },
];

function nextMonths(count: number) {
  const months: string[] = [];
  const now = new Date();
  for (let i = 0; i < count; i += 1) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const label = date.toLocaleString("en-US", {
      month: "short",
      year: "numeric",
    });
    months.push(label);
  }
  return months;
}

export default function FeeManagement({ students }: FeeManagementProps) {
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedStudent, setSelectedStudent] = useState(
    students[0]?.id ?? ""
  );
  const [selectedProfile, setSelectedProfile] = useState<Student | null>(null);
  const [monthFilter, setMonthFilter] = useState(
    () => new Date().toLocaleString("en-US", { month: "short", year: "numeric" })
  );
  const [statusFilter, setStatusFilter] = useState<"all" | "Paid" | "Unpaid">(
    "all"
  );
  const [nameFilter, setNameFilter] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [reminderMessage, setReminderMessage] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(
    () => new Date().toISOString().slice(0, 7)
  );
  const [amount, setAmount] = useState("100");
  const [method, setMethod] = useState<Payment["method"]>("Cash");
  const [note, setNote] = useState("");
  const [paymentDate, setPaymentDate] = useState(
    () => new Date().toISOString().slice(0, 10)
  );

  const monthOptions = useMemo(() => nextMonths(6), []);

  const paidTotal = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const freeCount = students.filter((student) => student.feeType === "Free").length;
  const maxMonthly = Math.max(
    ...monthlyFees.map((m) => m.paid + m.unpaid + m.free)
  );

  const handleRecordPayment = () => {
    if (!selectedStudent || !selectedMonth) return;
    const parsedAmount = Number(amount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) return;

    const monthLabel = new Date(`${selectedMonth}-01`).toLocaleString("en-US", {
      month: "short",
      year: "numeric",
    });

    const payment: Payment = {
      id: crypto.randomUUID(),
      studentId: selectedStudent,
      amount: parsedAmount,
      months: [monthLabel],
      method,
      note,
      date: paymentDate,
    };

    setPayments((prev) => [payment, ...prev]);
    setSelectedMonth(new Date().toISOString().slice(0, 7));
    setAmount("100");
    setNote("");
    setPaymentDate(new Date().toISOString().slice(0, 10));
  };

  const paidStudentIdsForMonth = useMemo(() => {
    const ids = new Set<string>();
    payments.forEach((payment) => {
      if (payment.months.includes(monthFilter)) {
        ids.add(payment.studentId);
      }
    });
    return ids;
  }, [payments, monthFilter]);

  const handleToggleSelect = (studentId: string) => {
    setSelectedIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSendReminder = (scope: "all" | "selected") => {
    if (scope === "selected" && selectedIds.length === 0) return;
    const count =
      scope === "all"
        ? students.filter((student) => !paidStudentIdsForMonth.has(student.id)).length
        : selectedIds.length;
    setReminderMessage(
      `Reminder queued for ${count} parent${count === 1 ? "" : "s"}.`
    );
    if (scope === "selected") {
      setSelectedIds([]);
    }
  };

  return (
    <div className={styles.form}>
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

      {activeTab === "Overview" ? (
        <div className={styles.metricGrid}>
          <div className={styles.metricCard}>
            <h3 className={styles.metricTitle}>Monthly Fee</h3>
            <div className={styles.metricValue}>${monthlyFee}</div>
            <p className={styles.subtitle}>Default monthly fee for paid students.</p>
          </div>
          <div className={styles.metricCard}>
            <h3 className={styles.metricTitle}>Total Paid</h3>
            <div className={styles.metricValue}>${paidTotal}</div>
            <p className={styles.subtitle}>Recorded payments this session.</p>
          </div>
          <div className={styles.metricCard}>
            <h3 className={styles.metricTitle}>Free Students</h3>
            <div className={styles.metricValue}>{freeCount}</div>
            <p className={styles.subtitle}>Monthly fee waived.</p>
          </div>
        </div>
      ) : null}


      {activeTab === "Record Payments" ? (
        <div className={styles.form}>
          <div className={styles.sectionTitle}>Record Payment</div>
          <div className={styles.fieldRow}>
            <label className={styles.label}>
              Student
              <select
                className={styles.input}
                value={selectedStudent}
                onChange={(event) => setSelectedStudent(event.target.value)}
              >
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} ({student.classCode})
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.label}>
              Amount
              <input
                className={styles.input}
                type="number"
                min="0"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </label>
            <label className={styles.label}>
              Method
              <select
                className={styles.input}
                value={method}
                onChange={(event) => setMethod(event.target.value as Payment["method"])}
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Bank">Bank</option>
              </select>
            </label>
          </div>

          <div className={styles.sectionTitle}>Payment Month</div>
          <div className={styles.fieldRow}>
            <label className={styles.label}>
              Month
              <input
                className={styles.input}
                type="month"
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
              />
            </label>
            <label className={styles.label}>
              Payment Date
              <input
                className={styles.input}
                type="date"
                value={paymentDate}
                onChange={(event) => setPaymentDate(event.target.value)}
              />
            </label>
          </div>

          <label className={styles.label}>
            Note
            <input
              className={styles.input}
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </label>

          <button className={styles.button} type="button" onClick={handleRecordPayment}>
            Save Payment
          </button>

          <div className={styles.sectionTitle}>Recent Payments</div>
          {students.length === 0 ? (
            <div className={styles.empty}>No students available.</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Months</th>
                  <th>Amount</th>
                  <th>Method</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => {
                  const student = students.find((item) => item.id === payment.studentId);
                  return (
                    <tr key={payment.id}>
                      <td>{student?.name ?? "-"}</td>
                      <td>{payment.months.join(", ")}</td>
                      <td>${payment.amount}</td>
                      <td>{payment.method}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      ) : null}

      {activeTab === "Overview" ? (
        <div className={styles.profileSection}>
          <div className={styles.sectionTitle}>Monthly Report</div>
          <p className={styles.subtitle}>
            Export collection vs outstanding. (Demo summary)
          </p>
          <div className={styles.profileGrid}>
            <div className={styles.profileField}>
              <span>Collected</span>
              <div className={styles.profileValue}>${paidTotal}</div>
            </div>
            <div className={styles.profileField}>
              <span>Free Students</span>
              <div className={styles.profileValue}>{freeCount}</div>
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === "Overview" ? (
        <article className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div>
              <h3 className={styles.chartTitle}>Monthly Fees</h3>
              <p className={styles.chartSubtitle}>Paid / Unpaid / Free (last 5 months)</p>
            </div>
          </div>
          <div className={styles.legend}>
            <span className={styles.legendItem}>
              <span className={styles.legendSwatch} style={{ background: "#6366f1" }} />
              Paid
            </span>
            <span className={styles.legendItem}>
              <span className={styles.legendSwatch} style={{ background: "#0ea5e9" }} />
              Unpaid
            </span>
            <span className={styles.legendItem}>
              <span className={styles.legendSwatch} style={{ background: "#f97316" }} />
              Free
            </span>
          </div>
          <div className={styles.chartBars}>
            {monthlyFees.map((month) => {
              const total = month.paid + month.unpaid + month.free;
              return (
                <div key={month.month} className={styles.chartBarGroup}>
                  <div className={styles.chartStack}>
                    <span
                      className={styles.chartBarPrimary}
                      style={{ height: `${(month.paid / maxMonthly) * 100}%` }}
                    />
                    <span
                      className={styles.chartBarSecondary}
                      style={{ height: `${(month.unpaid / maxMonthly) * 100}%` }}
                    />
                    <span
                      className={styles.chartBarMuted}
                      style={{ height: `${(month.free / maxMonthly) * 100}%` }}
                    />
                  </div>
                  <span className={styles.chartLabel}>{month.month}</span>
                  <span className={styles.chartValue}>{total}</span>
                </div>
              );
            })}
          </div>
        </article>
      ) : null}

      {activeTab === "Show Payment" ? (
        <div className={styles.form}>
          <div className={styles.sectionTitle}>Payments by Month</div>
          <div className={styles.listToolbar}>
            <input
              className={styles.searchInput}
              type="search"
              placeholder="Search student name"
              value={nameFilter}
              onChange={(event) => {
                setNameFilter(event.target.value);
                setPage(1);
              }}
            />
            <div className={styles.fieldRow}>
            <label className={styles.label}>
              Month
              <select
                className={styles.input}
                value={monthFilter}
                onChange={(event) => setMonthFilter(event.target.value)}
              >
                {monthOptions.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.label}>
              Status
              <select
                className={styles.input}
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as "all" | "Paid" | "Unpaid")
                }
              >
                <option value="all">All</option>
                <option value="Paid">Paid</option>
                <option value="Unpaid">Unpaid</option>
              </select>
            </label>
            <div className={styles.inlineActions}>
              <button
                className={styles.inlineButton}
                type="button"
                onClick={() => handleSendReminder("all")}
              >
                Send Reminder to All Unpaid
              </button>
              <button
                className={styles.inlineButton}
                type="button"
                onClick={() => handleSendReminder("selected")}
                disabled={selectedIds.length === 0}
              >
                Send Reminder to Selected
              </button>
            </div>
            </div>
          </div>

          {reminderMessage ? (
            <div className={styles.saveMessage}>{reminderMessage}</div>
          ) : null}

          {students.length === 0 ? (
            <div className={styles.empty}>No students available.</div>
          ) : null}

          {(() => {
            const filteredStudents = students.filter((student) => {
              const matchesName =
                nameFilter.trim().length === 0 ||
                student.name.toLowerCase().includes(nameFilter.trim().toLowerCase());
              if (!matchesName) return false;
              if (statusFilter === "all") return true;
              const isPaid = paidStudentIdsForMonth.has(student.id);
              return statusFilter === "Paid" ? isPaid : !isPaid;
            });

            const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
            const pagedStudents = filteredStudents.slice(
              (page - 1) * pageSize,
              page * pageSize
            );

            return (
              <>
                <table className={styles.table}>
            <thead>
              <tr>
                <th>Select</th>
                <th>Student</th>
                <th>Status</th>
                <th>Roll #</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Payment Date</th>
              </tr>
            </thead>
            <tbody>
              {pagedStudents.map((student) => {
                  const isPaid = paidStudentIdsForMonth.has(student.id);
                  const relatedPayments = payments.filter((payment) =>
                    payment.months.includes(monthFilter)
                  );
                  const studentPayments = relatedPayments.filter(
                    (payment) => payment.studentId === student.id
                  );
                  const amount = studentPayments.reduce(
                    (sum, payment) => sum + payment.amount,
                    0
                  );
                  const method = studentPayments[0]?.method ?? "-";
                  const paymentDate = studentPayments[0]?.date ?? "-";
                  return (
                    <tr key={student.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(student.id)}
                          onChange={() => handleToggleSelect(student.id)}
                        />
                      </td>
                      <td
                        className={styles.rowClickable}
                        onClick={() => setSelectedProfile(student)}
                      >
                        {student.name}
                      </td>
                      <td>{isPaid ? "Paid" : "Unpaid"}</td>
                      <td>{student.rollNumber || "-"}</td>
                      <td>{amount ? `$${amount}` : "-"}</td>
                      <td>{method}</td>
                      <td>{paymentDate}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
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
                        setPageSize(Number(event.target.value));
                        setPage(1);
                      }}
                    >
                      {[10, 25, 50].map((size) => (
                        <option key={size} value={size}>
                          {size} / page
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      ) : null}

      {selectedProfile ? (
        <StudentProfileModal
          student={selectedProfile}
          onClose={() => setSelectedProfile(null)}
        />
      ) : null}
    </div>
  );
}
