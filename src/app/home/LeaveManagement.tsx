"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "../styles/home.module.css";
import { apiUrl } from "../../lib/api";

type LeaveCategory = {
  id: number;
  name: string;
  role: string;
  maxDays: number;
  periodType?: string | null;
  maxPerPeriod?: number | null;
  active: boolean;
};

type LeaveRequest = {
  id: number;
  employeeId: number;
  categoryId: number;
  categoryName: string;
  role: string;
  fromDate: string;
  toDate: string;
  reason: string;
  attachmentKey?: string;
  status: string;
  appliedAt: string;
  reviewedAt?: string;
  reviewedBy?: number;
  reviewerNote?: string;
};

type LeaveManagementProps = {
  role: string;
};

const roleOptions = ["admin", "teacher", "parent", "student", "accountant", "transport"];

export default function LeaveManagement({ role }: LeaveManagementProps) {
  const [activeTab, setActiveTab] = useState(role === "admin" ? "Categories" : "Leave List");
  const [categories, setCategories] = useState<LeaveCategory[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [decisionPending, setDecisionPending] = useState<Record<number, string>>(
    {}
  );

  const [catName, setCatName] = useState("");
  const [catRole, setCatRole] = useState("teacher");
  const [catDays, setCatDays] = useState(1);
  const [catPeriodType, setCatPeriodType] = useState<"MONTHLY" | "YEARLY" | "">(
    ""
  );
  const [catMaxPerPeriod, setCatMaxPerPeriod] = useState(1);
  const [catActive, setCatActive] = useState(true);

  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [attachmentKey, setAttachmentKey] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const isAdmin = role === "admin";

  const loadData = async () => {
    setIsLoading(true);
    const token = window.localStorage.getItem("authToken");
    const catUrl = isAdmin
      ? apiUrl("/api/leaves/categories?includeInactive=true")
      : apiUrl(`/api/leaves/categories?role=${role}`);
    const catRes = await fetch(catUrl, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (catRes.ok) {
      setCategories(await catRes.json());
    }
    const reqRes = await fetch(apiUrl("/api/leaves"), {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (reqRes.ok) {
      setRequests(await reqRes.json());
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(null), 2000);
    return () => window.clearTimeout(timer);
  }, [message]);

  const uploadAttachment = async (file: File) => {
    setUploadError(null);
    const token = window.localStorage.getItem("authToken");
    const uploadRequest = await fetch(
      apiUrl(
        `/api/leaves/upload?contentType=${encodeURIComponent(
          file.type
        )}&fileName=${encodeURIComponent(file.name)}&sizeBytes=${file.size}`
      ),
      {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }
    );
    if (!uploadRequest.ok) {
      setUploadError("Upload failed");
      return null;
    }
    const { uploadUrl, objectKey } = await uploadRequest.json();
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!uploadResponse.ok) {
      setUploadError("Upload failed");
      return null;
    }
    return objectKey as string;
  };

  const handleAttachment = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const key = await uploadAttachment(file);
    if (key) {
      setAttachmentKey(key);
      setMessage("Attachment uploaded.");
    }
  };

  const handleApply = async () => {
    if (!leaveTypeId || !fromDate || !toDate) {
      setMessage("Select leave type and dates.");
      return;
    }
    const start = new Date(fromDate);
    const end = new Date(toDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setMessage("Invalid date selection.");
      return;
    }
    if (start > end) {
      setMessage("Start date must be before or equal to end date.");
      return;
    }
    if (start < today) {
      setMessage("Start date cannot be in the past.");
      return;
    }
    const token = window.localStorage.getItem("authToken");
    const response = await fetch(apiUrl("/api/leaves"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        categoryId: Number(leaveTypeId),
        fromDate,
        toDate,
        reason,
        attachmentKey,
      }),
    });
    if (response.ok) {
      setMessage("Leave request submitted.");
      setLeaveTypeId("");
      setFromDate("");
      setToDate("");
      setReason("");
      setAttachmentKey(null);
      loadData();
    } else {
      let errorMessage = "Unable to submit leave.";
      try {
        const data = await response.json();
        if (data?.message) errorMessage = data.message;
      } catch {
        // ignore
      }
      setMessage(errorMessage);
    }
  };

  const handleCategorySave = async () => {
    const token = window.localStorage.getItem("authToken");
    const response = await fetch(apiUrl("/api/leaves/categories"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        name: catName,
        role: catRole,
        maxDays: catDays,
        periodType: catPeriodType || null,
        maxPerPeriod: catPeriodType ? catMaxPerPeriod : null,
        active: catActive,
      }),
    });
    if (response.ok) {
      setMessage("Category saved.");
      setCatName("");
      setCatDays(1);
      setCatPeriodType("");
      setCatMaxPerPeriod(1);
      loadData();
    } else {
      setMessage("Unable to save category.");
    }
  };

  const handleDecision = async (id: number, status: string) => {
    if (decisionPending[id]) {
      return;
    }
    setDecisionPending((prev) => ({ ...prev, [id]: status }));
    const token = window.localStorage.getItem("authToken");
    const response = await fetch(apiUrl(`/api/leaves/${id}/decision`), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ status }),
    });
    if (response.ok) {
      setMessage("Decision saved.");
      loadData();
    } else {
      setMessage("Unable to update.");
    }
    setDecisionPending((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const visibleCategories = useMemo(() => {
    return isAdmin ? categories : categories.filter((c) => c.role === role);
  }, [categories, isAdmin, role]);

  return (
    <div className={styles.form}>
      <div className={styles.tabs}>
        {(isAdmin ? ["Categories", "Leave Requests"] : ["Leave List", "Leave Request"]).map(
          (tab) => (
            <button
              key={tab}
              type="button"
              className={`${styles.tab} ${tab === activeTab ? styles.tabActive : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          )
        )}
      </div>

      {message ? <div className={styles.success}>{message}</div> : null}

      {isLoading ? (
        <div className={styles.loadingCard}>
          <div className={styles.skeletonTitle} />
          <div className={styles.skeletonLine} />
        </div>
      ) : isAdmin && activeTab === "Categories" ? (
        <div className={styles.listLayout}>
          <div className={styles.profileSection}>
            <div className={styles.sectionTitle}>Add Leave Category</div>
            <div className={styles.fieldGrid}>
              <label className={styles.label}>
                Leave Category Name <span className={styles.requiredMark}>*</span>
                <input
                  className={styles.input}
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                />
              </label>
              <label className={styles.label}>
                Role <span className={styles.requiredMark}>*</span>
                <select
                  className={styles.input}
                  value={catRole}
                  onChange={(e) => setCatRole(e.target.value)}
                >
                  {roleOptions.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.label}>
                Total Days <span className={styles.requiredMark}>*</span>
                <input
                  className={styles.input}
                  type="number"
                  value={catDays}
                  onChange={(e) => setCatDays(Number(e.target.value))}
                />
              </label>
              <label className={styles.label}>
                Limit Period
                <select
                  className={styles.input}
                  value={catPeriodType}
                  onChange={(e) =>
                    setCatPeriodType(e.target.value as "MONTHLY" | "YEARLY" | "")
                  }
                >
                  <option value="">None</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="YEARLY">Yearly</option>
                </select>
              </label>
              <label className={styles.label}>
                Max Days per Period
                <input
                  className={styles.input}
                  type="number"
                  value={catMaxPerPeriod}
                  onChange={(e) => setCatMaxPerPeriod(Number(e.target.value))}
                  disabled={!catPeriodType}
                />
              </label>
              <label className={styles.label}>
                Status
                <select
                  className={styles.input}
                  value={catActive ? "active" : "inactive"}
                  onChange={(e) => setCatActive(e.target.value === "active")}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
            </div>
            <div className={styles.formActions}>
              <button className={styles.button} type="button" onClick={handleCategorySave}>
                Save
              </button>
            </div>
          </div>
          <div className={styles.profileSection}>
            <div className={styles.sectionTitle}>Leave Category List</div>
            <div className={styles.tableResponsive}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Total Days</th>
                    <th>Period</th>
                    <th>Max Days/Period</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat, index) => (
                    <tr key={cat.id}>
                      <td>{index + 1}</td>
                      <td>{cat.name}</td>
                      <td>{cat.role}</td>
                      <td>{cat.maxDays}</td>
                      <td>{cat.periodType ?? "-"}</td>
                      <td>{cat.maxPerPeriod ?? "-"}</td>
                      <td>{cat.active ? "Active" : "Inactive"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : isAdmin && activeTab === "Leave Requests" ? (
        <div className={styles.profileSection}>
          <div className={styles.sectionTitle}>Leave Requests</div>
          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Leave Type</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id}>
                    <td>{req.employeeId}</td>
                    <td>{req.categoryName}</td>
                    <td>{req.fromDate}</td>
                    <td>{req.toDate}</td>
                    <td>{req.status}</td>
                    <td>
                      {(() => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const from = new Date(req.fromDate);
                        const isFuture = !Number.isNaN(from.getTime()) && from > today;
                        const approveDisabled =
                          decisionPending[req.id] === "APPROVED" ||
                          req.status === "APPROVED" ||
                          req.status === "REJECTED";
                        const rejectDisabled =
                          decisionPending[req.id] === "REJECTED" ||
                          req.status === "REJECTED" ||
                          (req.status === "APPROVED" && !isFuture);
                        return (
                          <>
                            <button
                              className={styles.inlineButton}
                              type="button"
                              onClick={() => handleDecision(req.id, "APPROVED")}
                              disabled={approveDisabled}
                            >
                              {decisionPending[req.id] === "APPROVED"
                                ? "Approving..."
                                : "Approve"}
                            </button>
                            <button
                              className={styles.inlineButton}
                              type="button"
                              onClick={() => handleDecision(req.id, "REJECTED")}
                              disabled={rejectDisabled}
                            >
                              {decisionPending[req.id] === "REJECTED"
                                ? "Rejecting..."
                                : "Reject"}
                            </button>
                          </>
                        );
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === "Leave Request" ? (
        <div className={styles.profileSection}>
          <div className={styles.sectionTitle}>Leave Request</div>
          <div className={styles.fieldGrid}>
            <label className={styles.label}>
              Leave Type <span className={styles.requiredMark}>*</span>
              <select
                className={styles.input}
                value={leaveTypeId}
                onChange={(e) => setLeaveTypeId(e.target.value)}
              >
                <option value="">Select</option>
                {visibleCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.label}>
              From Date <span className={styles.requiredMark}>*</span>
              <input
                className={styles.input}
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </label>
            <label className={styles.label}>
              To Date <span className={styles.requiredMark}>*</span>
              <input
                className={styles.input}
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </label>
            <label className={styles.label}>
              Reason
              <textarea
                className={styles.input}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </label>
            <label className={styles.label}>
              Attachment
              <input className={styles.input} type="file" onChange={handleAttachment} />
            </label>
            {uploadError ? <div className={styles.error}>{uploadError}</div> : null}
          </div>
          <div className={styles.formActions}>
            <button className={styles.button} type="button" onClick={handleApply}>
              Save
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.profileSection}>
          <div className={styles.sectionTitle}>Leave List</div>
          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Leave Type</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id}>
                    <td>{req.categoryName}</td>
                    <td>{req.fromDate}</td>
                    <td>{req.toDate}</td>
                    <td>{req.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}