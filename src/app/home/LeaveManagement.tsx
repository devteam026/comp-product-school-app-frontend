"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "../styles/home.module.css";
import { apiUrl } from "../../lib/api";
import { DESIGNATION_OPTIONS } from "./data";

type LeaveCategory = {
  id: number;
  name: string;
  roles?: string[];
  /** legacy field — present when backend hasn't restarted yet */
  role?: string;
  maxDays: number;
  periodType?: string | null;
  maxPerPeriod?: number | null;
  active: boolean;
};

/** Normalise old `role` string or new `roles` array into a string array */
function getCatRoles(cat: LeaveCategory): string[] {
  if (cat.roles && cat.roles.length > 0) return cat.roles;
  if (cat.role) return cat.role.split(",").map((r) => r.trim()).filter(Boolean);
  return [];
}

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

const roleOptions = DESIGNATION_OPTIONS;

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
  const [catRoles, setCatRoles] = useState<string[]>(["teacher"]);
  const [catDays, setCatDays] = useState(1);
  const [catPeriodType, setCatPeriodType] = useState<"MONTHLY" | "YEARLY" | "">(
    ""
  );
  const [catMaxPerPeriod, setCatMaxPerPeriod] = useState(1);
  const [catActive, setCatActive] = useState(true);
  const [editingCatId, setEditingCatId] = useState<number | null>(null);
  const [deletingCatId, setDeletingCatId] = useState<number | null>(null);
  const [catDeleteConfirm, setCatDeleteConfirm] = useState<LeaveCategory | null>(null);

  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [attachmentKey, setAttachmentKey] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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

  const handleAttachment = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setIsUploading(true);
    try {
      const token = window.localStorage.getItem("authToken");
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(apiUrl("/api/leaves/upload-file"), {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        setUploadError(err?.error ?? "Upload failed. Please try again.");
        return;
      }
      const data = await response.json();
      setAttachmentKey(data.objectKey);
      setMessage("Attachment uploaded.");
    } catch {
      setUploadError("Upload failed. Check your connection and try again.");
    } finally {
      setIsUploading(false);
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
      setUploadError(null);
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

  const resetCatForm = () => {
    setCatName("");
    setCatRoles(["teacher"]);
    setCatDays(1);
    setCatPeriodType("");
    setCatMaxPerPeriod(1);
    setCatActive(true);
    setEditingCatId(null);
  };

  const handleCategorySave = async () => {
    if (!catName.trim()) {
      setMessage("Leave category name is required.");
      return;
    }
    const token = window.localStorage.getItem("authToken");
    const url = editingCatId
      ? apiUrl(`/api/leaves/categories/${editingCatId}`)
      : apiUrl("/api/leaves/categories");
    const response = await fetch(url, {
      method: editingCatId ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        name: catName,
        roles: catRoles,
        maxDays: catDays,
        periodType: catPeriodType || null,
        maxPerPeriod: catPeriodType ? catMaxPerPeriod : null,
        active: catActive,
      }),
    });
    if (response.ok) {
      setMessage(editingCatId ? "Category updated." : "Category saved.");
      resetCatForm();
      loadData();
    } else {
      setMessage("Unable to save category.");
    }
  };

  const handleCategoryEdit = (cat: LeaveCategory) => {
    setEditingCatId(cat.id);
    setCatName(cat.name);
    const resolved = getCatRoles(cat);
    setCatRoles(resolved.length > 0 ? resolved : ["teacher"]);
    setCatDays(cat.maxDays);
    setCatPeriodType((cat.periodType as "MONTHLY" | "YEARLY" | "") ?? "");
    setCatMaxPerPeriod(cat.maxPerPeriod ?? 1);
    setCatActive(cat.active);
  };

  const handleCategoryDelete = async (cat: LeaveCategory) => {
    setDeletingCatId(cat.id);
    setCatDeleteConfirm(null);
    const token = window.localStorage.getItem("authToken");
    const response = await fetch(apiUrl(`/api/leaves/categories/${cat.id}`), {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (response.ok) {
      setMessage("Category deleted.");
      loadData();
    } else {
      setMessage("Unable to delete category.");
    }
    setDeletingCatId(null);
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
    return isAdmin ? categories : categories.filter((c) => getCatRoles(c).includes(role));
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
            <div className={styles.sectionTitle}>{editingCatId ? "Edit Leave Category" : "Add Leave Category"}</div>
            <div className={styles.fieldGrid}>
              <label className={styles.label}>
                Leave Category Name <span className={styles.requiredMark}>*</span>
                <input
                  className={styles.input}
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                />
              </label>
              <div className={styles.label}>
                Role <span className={styles.requiredMark}>*</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px", marginTop: "6px" }}>
                  {roleOptions.map((r) => (
                    <label key={r} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", fontWeight: 400, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={catRoles.includes(r)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCatRoles((prev) => [...prev, r]);
                          } else {
                            setCatRoles((prev) => prev.filter((x) => x !== r));
                          }
                        }}
                      />
                      {r}
                    </label>
                  ))}
                </div>
              </div>
              <br></br>  <br></br>
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
                {editingCatId ? "Update Category" : "Save Category"}
              </button>
              {editingCatId ? (
                <button className={styles.inlineButton} type="button" onClick={resetCatForm}>
                  Cancel
                </button>
              ) : null}
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
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat, index) => (
                    <tr key={cat.id}>
                      <td>{index + 1}</td>
                      <td>{cat.name}</td>
                      <td>{getCatRoles(cat).join(", ") || "-"}</td>
                      <td>{cat.maxDays}</td>
                      <td>{cat.periodType ?? "-"}</td>
                      <td>{cat.maxPerPeriod ?? "-"}</td>
                      <td>{cat.active ? "Active" : "Inactive"}</td>
                      <td>
                        <button
                          className={styles.inlineButton}
                          type="button"
                          onClick={() => handleCategoryEdit(cat)}
                          disabled={deletingCatId === cat.id}
                        >
                          Edit
                        </button>
                        <button
                          className={styles.inlineButton}
                          type="button"
                          onClick={() => setCatDeleteConfirm(cat)}
                          disabled={deletingCatId === cat.id}
                        >
                          {deletingCatId === cat.id ? "Deleting..." : "Delete"}
                        </button>
                      </td>
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
              <input
                className={styles.input}
                type="file"
                onChange={handleAttachment}
                disabled={isUploading}
              />
              {isUploading ? <span style={{ fontSize: "12px", color: "#64748b" }}>Uploading...</span> : null}
              {!isUploading && attachmentKey ? <span style={{ fontSize: "12px", color: "#16a34a" }}>Attached</span> : null}
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

      {catDeleteConfirm ? (
        <div className={styles.modalBackdrop} onClick={() => setCatDeleteConfirm(null)}>
          <div
            className={styles.modalCard}
            style={{ maxWidth: 440, padding: "28px 32px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "16px" }}>
              <span style={{ fontSize: "22px", lineHeight: 1 }}>⚠️</span>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "#0f172a" }}>
                Delete &quot;{catDeleteConfirm.name}&quot;?
              </h3>
            </div>
            <div style={{ fontSize: "14px", color: "#475569", marginBottom: "24px" }}>
              This will permanently remove the leave category. Existing leave requests using this category may be affected.
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                className={styles.inlineButton}
                type="button"
                onClick={() => setCatDeleteConfirm(null)}
                style={{ padding: "8px 20px" }}
              >
                Cancel
              </button>
              <button
                className={styles.button}
                type="button"
                onClick={() => handleCategoryDelete(catDeleteConfirm)}
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