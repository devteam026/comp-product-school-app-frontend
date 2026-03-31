"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "../styles/home.module.css";
import { apiUrl } from "../../lib/api";

const transportTabs = ["Summary", "Setup"] as const;
const setupTabs = ["Route & Vehicle", "Stoppage Master", "Assign Vehicle"] as const;
const vehicleTypes = ["Bus", "Van", "4 Wheeler", "3 Wheeler", "2 Wheeler", "Other"];

type TransportRoute = {
  id: number;
  name: string;
  active: boolean;
};

type TransportVehicle = {
  id: number;
  vehicleNo: string;
  vehicleType?: string;
  capacity?: number;
  insuranceNumber?: string;
  insuranceExpiryDate?: string;
  fitnessExpiryDate?: string;
  pollutionExpiryDate?: string;
  permitNumber?: string;
  permitExpiryDate?: string;
  insuranceDocKey?: string;
  fitnessDocKey?: string;
  pollutionDocKey?: string;
  permitDocKey?: string;
  active: boolean;
};

type TransportDriver = {
  id: number;
  name: string;
  phone: string;
  alternatePhone?: string;
  bloodGroup?: string;
  licenseNo?: string;
  active: boolean;
};

type TransportStoppage = {
  id: number;
  routeName: string;
  stopName: string;
  checkInTime: string;
  checkOutTime: string;
  feeAmount?: number;
  distanceKm?: number;
  active: boolean;
};

type TransportAssignment = {
  id: number;
  routeName: string;
  vehicleNo: string;
  driverId: number;
  active: boolean;
};

type Employee = {
  id: number;
  firstName: string;
  middleName?: string;
  lastName: string;
  department?: string;
  mobileNumber?: string;
  whatsappNumber?: string;
  bloodGroup?: string;
  drivingLicense?: string;
};

type TransportSummaryRow = {
  assignmentId: number;
  routeName: string;
  vehicleNo: string;
  vehicleType?: string;
  capacity?: number;
  driverName?: string;
  driverPhone?: string;
  studentCount: number;
  freeSeats: number;
  active: boolean;
};

type TransportStudentRow = {
  id: string;
  name: string;
  classCode: string;
  registerNo?: string;
  stopName?: string;
};

export default function TransportManagement() {
  const [activeTransportTab, setActiveTransportTab] =
    useState<(typeof transportTabs)[number]>("Summary");
  const [activeSetupTab, setActiveSetupTab] =
    useState<(typeof setupTabs)[number]>("Route & Vehicle");
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [vehicles, setVehicles] = useState<TransportVehicle[]>([]);
  const [drivers, setDrivers] = useState<TransportDriver[]>([]);
  const [transportEmployees, setTransportEmployees] = useState<Employee[]>([]);
  const [selectedTransportEmployeeId, setSelectedTransportEmployeeId] = useState("");
  const [stoppages, setStoppages] = useState<TransportStoppage[]>([]);
  const [assignments, setAssignments] = useState<TransportAssignment[]>([]);
  const [summary, setSummary] = useState<TransportSummaryRow[]>([]);
  const [selectedSummary, setSelectedSummary] = useState<TransportSummaryRow | null>(null);
  const [summaryStudents, setSummaryStudents] = useState<TransportStudentRow[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryStoppages, setSummaryStoppages] = useState<TransportStoppage[]>([]);
  const [summaryStudentSearch, setSummaryStudentSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [routeForm, setRouteForm] = useState({ id: 0, name: "", active: true });
  const [vehicleForm, setVehicleForm] = useState({
    id: 0,
    vehicleNo: "",
    vehicleType: "Bus",
    capacity: 0,
    insuranceNumber: "",
    insuranceExpiryDate: "",
    fitnessExpiryDate: "",
    pollutionExpiryDate: "",
    permitNumber: "",
    permitExpiryDate: "",
    insuranceDocKey: "",
    fitnessDocKey: "",
    pollutionDocKey: "",
    permitDocKey: "",
    active: true,
  });
  const [vehicleUploadStatus, setVehicleUploadStatus] = useState<Record<string, string>>(
    {}
  );
  const [vehicleSelectedFiles, setVehicleSelectedFiles] = useState<Record<string, string>>(
    {}
  );
  const [driverForm, setDriverForm] = useState({
    id: 0,
    name: "",
    phone: "",
    alternatePhone: "",
    bloodGroup: "",
    licenseNo: "",
    active: true,
  });
  const [stoppageForm, setStoppageForm] = useState({
    id: 0,
    routeName: "",
    stopName: "",
    checkInTime: "",
    checkOutTime: "",
    feeAmount: 0,
    distanceKm: 0,
    active: true,
  });
  const [assignmentForm, setAssignmentForm] = useState({
    id: 0,
    routeName: "",
    vehicleNo: "",
    driverId: 0,
    active: true,
  });
  const token = typeof window !== "undefined" ? window.localStorage.getItem("authToken") : null;
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  const loadAll = async () => {
    setLoading(true);
    const fetchJson = async (url: string) => {
      const res = await fetch(apiUrl(url), { headers });
      return res.ok ? res.json() : [];
    };
    const [
      routesData,
      vehiclesData,
      driversData,
      employeesData,
      stoppagesData,
      assignmentsData,
      summaryData,
    ] = await Promise.all([
      fetchJson("/api/transport/routes"),
      fetchJson("/api/transport/vehicles"),
      fetchJson("/api/transport/drivers"),
      fetchJson("/api/employees"),
      fetchJson("/api/transport/stoppages"),
      fetchJson("/api/transport/assignments"),
      fetchJson("/api/transport/summary"),
    ]);
    setRoutes(routesData || []);
    setVehicles(vehiclesData || []);
    setDrivers(driversData || []);
    setTransportEmployees(employeesData || []);
    setStoppages(stoppagesData || []);
    setAssignments(assignmentsData || []);
    setSummary(summaryData || []);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const routeNames = useMemo(
    () => routes.map((route) => route.name).filter(Boolean),
    [routes]
  );
  const driverOptions = useMemo(() => drivers, [drivers]);
  const transportEmployeeOptions = useMemo(
    () =>
      transportEmployees.filter((employee) =>
        (employee.department ?? "").toLowerCase().includes("transport")
      ),
    [transportEmployees]
  );
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
    if (response.ok) {
      loadAll();
    }
  };

  const deleteEntity = async (url: string) => {
    const response = await fetch(apiUrl(url), { method: "DELETE", headers });
    if (response.ok) {
      loadAll();
    }
  };

  const uploadVehicleDoc = async (file: File, type: string) => {
    const token = window.localStorage.getItem("authToken");
    const uploadRequest = await fetch(
      apiUrl(
        `/api/transport/vehicles/upload?contentType=${encodeURIComponent(
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
  };

  const handleVehicleDocUpload = async (type: "insurance" | "fitness" | "pollution" | "permit") => {
    const input = document.createElement("input");
    input.type = "file";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      setVehicleSelectedFiles((prev) => ({ ...prev, [type]: file.name }));
      try {
        const objectKey = await uploadVehicleDoc(file, type);
        setVehicleForm((prev) => ({
          ...prev,
          ...(type === "insurance" ? { insuranceDocKey: objectKey } : {}),
          ...(type === "fitness" ? { fitnessDocKey: objectKey } : {}),
          ...(type === "pollution" ? { pollutionDocKey: objectKey } : {}),
          ...(type === "permit" ? { permitDocKey: objectKey } : {}),
        }));
        setVehicleUploadStatus((prev) => ({ ...prev, [type]: "Uploaded successfully." }));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        setVehicleUploadStatus((prev) => ({ ...prev, [type]: message }));
      }
    };
    input.click();
  };

  const openVehicleDoc = async (
    vehicleId: number,
    type: "insurance" | "fitness" | "pollution" | "permit"
  ) => {
    const token = window.localStorage.getItem("authToken");
    const response = await fetch(
      apiUrl(`/api/transport/vehicles/${vehicleId}/file-url?type=${type}`),
      { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
    );
    if (!response.ok) return;
    const data = await response.json();
    if (data?.url) {
      window.open(data.url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div>
      {loading ? (
        <div className={styles.loadingCard}>
          <div className={styles.skeletonTitle} />
          <div className={styles.skeletonLine} />
          <div className={styles.skeletonLine} />
        </div>
      ) : (
        <div className={styles.form}>
          <div className={styles.tabs}>
            {transportTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                className={`${styles.tab} ${
                  tab === activeTransportTab ? styles.tabActive : ""
                }`}
                onClick={() => setActiveTransportTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTransportTab === "Summary" ? (
            <>
              <div className={styles.sectionTitle}>Transport Summary</div>
              <div className={styles.tableResponsive}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Route</th>
                      <th>Vehicle</th>
                      <th>Type</th>
                      <th>Driver</th>
                      <th>Phone</th>
                      <th>Stops</th>
                      <th>Capacity</th>
                      <th>Students</th>
                      <th>Free Seats</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.length === 0 ? (
                      <tr>
                        <td colSpan={11}>No assignments found.</td>
                      </tr>
                    ) : (
                      summary.map((row, index) => (
                        <tr key={row.assignmentId}>
                          <td>{index + 1}</td>
                          <td
                            className={styles.rowClickable}
                            onClick={() => {
                              setSelectedSummary(row);
                              setSummaryStudentSearch("");
                              setSummaryStudents([]);
                              setSummaryStoppages(
                                stoppages.filter((stop) => stop.routeName === row.routeName)
                              );
                              setSummaryLoading(true);
                              fetch(
                                apiUrl(`/api/transport/assignments/${row.assignmentId}/students`),
                                { headers }
                              )
                                .then((res) => (res.ok ? res.json() : []))
                                .then((data) =>
                                  setSummaryStudents(Array.isArray(data) ? data : [])
                                )
                                .finally(() => setSummaryLoading(false));
                            }}
                          >
                            {row.routeName}
                          </td>
                          <td>{row.vehicleNo}</td>
                          <td>{row.vehicleType || "-"}</td>
                          <td>{row.driverName || "-"}</td>
                          <td>{row.driverPhone || "-"}</td>
                          <td>
                            {stoppages.filter((stop) => stop.routeName === row.routeName).length}
                          </td>
                          <td>{row.capacity ?? "-"}</td>
                          <td>{row.studentCount ?? 0}</td>
                          <td>{row.freeSeats ?? "-"}</td>
                          <td>{row.active ? "Active" : "Inactive"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {selectedSummary ? (
                <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
                  <div className={styles.modalCard}>
                    <div className={styles.modalHeader}>
                      <div>
                        <h3>Students on {selectedSummary.routeName}</h3>
                        <p className={styles.modalSubtitle}>
                          Vehicle {selectedSummary.vehicleNo}
                        </p>
                        {typeof selectedSummary.capacity === "number" &&
                        selectedSummary.capacity > 0 &&
                        selectedSummary.studentCount > selectedSummary.capacity ? (
                          <p className={styles.error}>
                            Capacity exceeded by{" "}
                            {selectedSummary.studentCount - selectedSummary.capacity} students.
                          </p>
                        ) : null}
                      </div>
                      <button
                        className={styles.inlineButton}
                        type="button"
                        onClick={() => setSelectedSummary(null)}
                      >
                        Close
                      </button>
                    </div>
                    <div className={styles.modalBody}>
                      <div className={styles.summaryGrid}>
                        <div>
                          <div className={styles.sectionTitle}>Stops</div>
                          {summaryStoppages.length === 0 ? (
                            <div className={styles.empty}>No stoppages added.</div>
                          ) : (
                            <div className={styles.tableResponsive}>
                              <table className={styles.table}>
                                <thead>
                                  <tr>
                                    <th>#</th>
                                    <th>Stop</th>
                                    <th>Amount</th>
                                    <th>Check-in</th>
                                    <th>Check-out</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {summaryStoppages.map((stop, index) => (
                                    <tr key={stop.id}>
                                      <td>{index + 1}</td>
                                      <td>{stop.stopName}</td>
                                      <td>{stop.feeAmount ?? "-"}</td>
                                      <td>{stop.checkInTime}</td>
                                      <td>{stop.checkOutTime}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                        <div>
                          <div className={styles.sectionTitle}>Students</div>
                          <div className={styles.listToolbar}>
                            <input
                              className={styles.searchInput}
                              type="search"
                              placeholder="Search student, class, stop..."
                              value={summaryStudentSearch}
                              onChange={(event) => setSummaryStudentSearch(event.target.value)}
                            />
                          </div>
                          {summaryLoading ? (
                            <div className={styles.loading}>Loading students...</div>
                          ) : summaryStudents.length === 0 ? (
                            <div className={styles.empty}>No students assigned.</div>
                          ) : (
                            <div className={styles.tableResponsive}>
                              <table className={styles.table}>
                                <thead>
                                  <tr>
                                    <th>#</th>
                                    <th>Name</th>
                                    <th>Class</th>
                                    <th>Stop</th>
                                    <th>Register #</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {summaryStudents
                                    .filter((student) => {
                                      const query = summaryStudentSearch.trim().toLowerCase();
                                      if (!query) return true;
                                      return (
                                        student.name.toLowerCase().includes(query) ||
                                        student.classCode.toLowerCase().includes(query) ||
                                        (student.stopName ?? "").toLowerCase().includes(query)
                                      );
                                    })
                                    .map((student, index) => (
                                    <tr key={student.id}>
                                      <td>{index + 1}</td>
                                      <td>{student.name}</td>
                                      <td>{student.classCode}</td>
                                      <td>{student.stopName || "-"}</td>
                                      <td>{student.registerNo || "-"}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </>
          ) : null}

          {activeTransportTab === "Setup" ? (
            <>
              <div className={styles.tabs}>
                {setupTabs.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={`${styles.tab} ${
                      tab === activeSetupTab ? styles.tabActive : ""
                    }`}
                    onClick={() => setActiveSetupTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </>
          ) : null}

          {activeTransportTab === "Setup" && activeSetupTab === "Route & Vehicle" ? (
            <>
              <div className={styles.sectionTitle}>Route Master</div>
              <div className={styles.fieldRow}>
                <label className={styles.label}>
                  Route Name
                  <input
                    className={styles.input}
                    value={routeForm.name}
                    onChange={(event) =>
                      setRouteForm({ ...routeForm, name: event.target.value })
                    }
                  />
                </label>
                <label className={styles.label}>
                  Active
                  <select
                    className={styles.input}
                    value={routeForm.active ? "yes" : "no"}
                    onChange={(event) =>
                      setRouteForm({
                        ...routeForm,
                        active: event.target.value === "yes",
                      })
                    }
                  >
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </label>
              </div>
              <button
                className={styles.button}
                type="button"
                onClick={() =>
                  saveEntity(
                    routeForm.id
                      ? `/api/transport/routes/${routeForm.id}`
                      : "/api/transport/routes",
                    routeForm.id ? "PUT" : "POST",
                    routeForm
                  ).then(() => setRouteForm({ id: 0, name: "", active: true }))
                }
              >
                {routeForm.id ? "Update Route" : "Save Route"}
              </button>
              <div className={styles.tableResponsive}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Route</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {routes.map((route, index) => (
                      <tr key={route.id}>
                        <td>{index + 1}</td>
                        <td>{route.name}</td>
                        <td>{route.active ? "Active" : "Inactive"}</td>
                        <td className={styles.actionRow}>
                          <button
                            className={styles.inlineButton}
                            type="button"
                            onClick={() => setRouteForm(route)}
                          >
                            Edit
                          </button>
                          <button
                            className={styles.inlineButton}
                            type="button"
                            onClick={() => deleteEntity(`/api/transport/routes/${route.id}`)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className={styles.sectionTitle}>Vehicle Master</div>
              <div className={styles.fieldRow}>
                <label className={styles.label}>
                  Vehicle No
                  <input
                    className={styles.input}
                    value={vehicleForm.vehicleNo}
                    onChange={(event) =>
                      setVehicleForm({ ...vehicleForm, vehicleNo: event.target.value })
                    }
                  />
                </label>
                <label className={styles.label}>
                  Vehicle Type
                  <select
                    className={styles.input}
                    value={vehicleForm.vehicleType}
                    onChange={(event) =>
                      setVehicleForm({ ...vehicleForm, vehicleType: event.target.value })
                    }
                  >
                    {vehicleTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={styles.label}>
                  Capacity
                  <input
                    className={styles.input}
                    type="number"
                    min={0}
                    value={vehicleForm.capacity ?? 0}
                    onChange={(event) =>
                      setVehicleForm({
                        ...vehicleForm,
                        capacity: Number(event.target.value),
                      })
                    }
                  />
                </label>
                <label className={styles.label}>
                  Insurance Number
                  <input
                    className={styles.input}
                    value={vehicleForm.insuranceNumber ?? ""}
                    onChange={(event) =>
                      setVehicleForm({ ...vehicleForm, insuranceNumber: event.target.value })
                    }
                  />
                </label>
                <label className={styles.label}>
                  Insurance Expiry Date
                  <input
                    className={styles.input}
                    type="date"
                    value={vehicleForm.insuranceExpiryDate ?? ""}
                    onChange={(event) =>
                      setVehicleForm({
                        ...vehicleForm,
                        insuranceExpiryDate: event.target.value,
                      })
                    }
                  />
                </label>
                <label className={styles.label}>
                  Fitness Expiry Date
                  <input
                    className={styles.input}
                    type="date"
                    value={vehicleForm.fitnessExpiryDate ?? ""}
                    onChange={(event) =>
                      setVehicleForm({
                        ...vehicleForm,
                        fitnessExpiryDate: event.target.value,
                      })
                    }
                  />
                </label>
                <label className={styles.label}>
                  Pollution Expiry Date
                  <input
                    className={styles.input}
                    type="date"
                    value={vehicleForm.pollutionExpiryDate ?? ""}
                    onChange={(event) =>
                      setVehicleForm({
                        ...vehicleForm,
                        pollutionExpiryDate: event.target.value,
                      })
                    }
                  />
                </label>
                <label className={styles.label}>
                  Permit Number
                  <input
                    className={styles.input}
                    value={vehicleForm.permitNumber ?? ""}
                    onChange={(event) =>
                      setVehicleForm({ ...vehicleForm, permitNumber: event.target.value })
                    }
                  />
                </label>
                <label className={styles.label}>
                  Permit Expiry Date
                  <input
                    className={styles.input}
                    type="date"
                    value={vehicleForm.permitExpiryDate ?? ""}
                    onChange={(event) =>
                      setVehicleForm({
                        ...vehicleForm,
                        permitExpiryDate: event.target.value,
                      })
                    }
                  />
                </label>

                <label className={styles.label}>
                  Active
                  <select
                    className={styles.input}
                    value={vehicleForm.active ? "yes" : "no"}
                    onChange={(event) =>
                      setVehicleForm({
                        ...vehicleForm,
                        active: event.target.value === "yes",
                      })
                    }
                  >
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </label>
              </div>
              <div className={styles.fieldRow}>
                <div className={styles.formActions}>
                  <button
                    className={styles.uploadButton}
                    type="button"
                    onClick={() => handleVehicleDocUpload("insurance")}
                  >
                    Upload Insurance
                  </button>
                  {vehicleSelectedFiles.insurance ? (
                    <div className={styles.helperText}>{vehicleSelectedFiles.insurance}</div>
                  ) : null}
                  {vehicleUploadStatus.insurance ? (
                    <div className={styles.success}>{vehicleUploadStatus.insurance}</div>
                  ) : null}
                  <button
                    className={styles.uploadButton}
                    type="button"
                    onClick={() => handleVehicleDocUpload("fitness")}
                  >
                    Upload Fitness
                  </button>
                  {vehicleSelectedFiles.fitness ? (
                    <div className={styles.helperText}>{vehicleSelectedFiles.fitness}</div>
                  ) : null}
                  {vehicleUploadStatus.fitness ? (
                    <div className={styles.success}>{vehicleUploadStatus.fitness}</div>
                  ) : null}
                  <button
                    className={styles.uploadButton}
                    type="button"
                    onClick={() => handleVehicleDocUpload("pollution")}
                  >
                    Upload Pollution
                  </button>
                  {vehicleSelectedFiles.pollution ? (
                    <div className={styles.helperText}>{vehicleSelectedFiles.pollution}</div>
                  ) : null}
                  {vehicleUploadStatus.pollution ? (
                    <div className={styles.success}>{vehicleUploadStatus.pollution}</div>
                  ) : null}
                  <button
                    className={styles.uploadButton}
                    type="button"
                    onClick={() => handleVehicleDocUpload("permit")}
                  >
                    Upload Permit
                  </button>
                  {vehicleSelectedFiles.permit ? (
                    <div className={styles.helperText}>{vehicleSelectedFiles.permit}</div>
                  ) : null}
                  {vehicleUploadStatus.permit ? (
                    <div className={styles.success}>{vehicleUploadStatus.permit}</div>
                  ) : null}
                </div>
              </div>
              <button
                className={styles.button}
                type="button"
                onClick={() =>
                  saveEntity(
                    vehicleForm.id
                      ? `/api/transport/vehicles/${vehicleForm.id}`
                      : "/api/transport/vehicles",
                    vehicleForm.id ? "PUT" : "POST",
                    vehicleForm
                  ).then(() => {
                    setVehicleForm({
                      id: 0,
                      vehicleNo: "",
                      vehicleType: "Bus",
                      capacity: 0,
                      insuranceNumber: "",
                      insuranceExpiryDate: "",
                      fitnessExpiryDate: "",
                      pollutionExpiryDate: "",
                      permitNumber: "",
                      permitExpiryDate: "",
                      insuranceDocKey: "",
                      fitnessDocKey: "",
                      pollutionDocKey: "",
                      permitDocKey: "",
                      active: true,
                    });
                    setVehicleUploadStatus({});
                    setVehicleSelectedFiles({});
                  })
                }
              >
                {vehicleForm.id ? "Update Vehicle" : "Save Vehicle"}
              </button>
              <div className={styles.tableResponsive}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Vehicle No</th>
                      <th>Type</th>
                      <th>Capacity</th>
                      <th>Insurance #</th>
                      <th>Insurance Exp</th>
                      <th>Fitness Exp</th>
                      <th>Pollution Exp</th>
                      <th>Permit #</th>
                      <th>Permit Exp</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles.map((vehicle, index) => (
                      <tr key={vehicle.id}>
                        <td>{index + 1}</td>
                        <td>{vehicle.vehicleNo}</td>
                        <td>{vehicle.vehicleType ?? "-"}</td>
                        <td>{vehicle.capacity ?? "-"}</td>
                        <td>{vehicle.insuranceNumber ?? "-"}</td>
                        <td>{vehicle.insuranceExpiryDate ?? "-"}</td>
                        <td>{vehicle.fitnessExpiryDate ?? "-"}</td>
                        <td>{vehicle.pollutionExpiryDate ?? "-"}</td>
                        <td>{vehicle.permitNumber ?? "-"}</td>
                        <td>{vehicle.permitExpiryDate ?? "-"}</td>
                        <td>{vehicle.active ? "Active" : "Inactive"}</td>
                        <td className={styles.actionRow}>
                          <button
                            className={styles.inlineButton}
                            type="button"
                            onClick={() => setVehicleForm(vehicle)}
                          >
                            Edit
                          </button>
                          <button
                            className={styles.inlineButton}
                            type="button"
                            onClick={() => openVehicleDoc(vehicle.id, "insurance")}
                            disabled={!vehicle.insuranceDocKey}
                          >
                            View Insurance
                          </button>
                          <button
                            className={styles.inlineButton}
                            type="button"
                            onClick={() => openVehicleDoc(vehicle.id, "fitness")}
                            disabled={!vehicle.fitnessDocKey}
                          >
                            View Fitness
                          </button>
                          <button
                            className={styles.inlineButton}
                            type="button"
                            onClick={() => openVehicleDoc(vehicle.id, "pollution")}
                            disabled={!vehicle.pollutionDocKey}
                          >
                            View Pollution
                          </button>
                          <button
                            className={styles.inlineButton}
                            type="button"
                            onClick={() => openVehicleDoc(vehicle.id, "permit")}
                            disabled={!vehicle.permitDocKey}
                          >
                            View Permit
                          </button>
                          <button
                            className={styles.inlineButton}
                            type="button"
                            onClick={() => deleteEntity(`/api/transport/vehicles/${vehicle.id}`)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className={styles.sectionTitle}>Driver Master</div>
              <div className={styles.fieldRow}>
                <label className={styles.label}>
                  Employee (Transport)
                  <select
                    className={styles.input}
                    value={selectedTransportEmployeeId}
                    onChange={(event) => {
                      const value = event.target.value;
                      setSelectedTransportEmployeeId(value);
                      const selected = transportEmployeeOptions.find(
                        (employee) => String(employee.id) === value
                      );
                      if (selected) {
                        const fullName = [
                          selected.firstName,
                          selected.middleName,
                          selected.lastName,
                        ]
                          .filter(Boolean)
                          .join(" ");
                        setDriverForm((prev) => ({
                          ...prev,
                          name: fullName,
                          phone: selected.mobileNumber ?? prev.phone,
                          alternatePhone: selected.whatsappNumber ?? prev.alternatePhone,
                          bloodGroup: selected.bloodGroup ?? prev.bloodGroup,
                          licenseNo: selected.drivingLicense ?? prev.licenseNo,
                        }));
                      }
                    }}
                  >
                    <option value="">Select</option>
                    {transportEmployeeOptions.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.firstName} {employee.lastName} (ID {employee.id})
                      </option>
                    ))}
                  </select>
                </label>
                <label className={styles.label}>
                  Name
                  <input
                    className={styles.input}
                    value={driverForm.name}
                    onChange={(event) =>
                      setDriverForm({ ...driverForm, name: event.target.value })
                    }
                  />
                </label>
                <label className={styles.label}>
                  Phone
                  <input
                    className={styles.input}
                    value={driverForm.phone}
                    onChange={(event) =>
                      setDriverForm({ ...driverForm, phone: event.target.value })
                    }
                  />
                </label>
                <label className={styles.label}>
                  Alternate No
                  <input
                    className={styles.input}
                    value={driverForm.alternatePhone}
                    onChange={(event) =>
                      setDriverForm({
                        ...driverForm,
                        alternatePhone: event.target.value,
                      })
                    }
                  />
                </label>
                <label className={styles.label}>
                  Blood Group
                  <input
                    className={styles.input}
                    value={driverForm.bloodGroup}
                    onChange={(event) =>
                      setDriverForm({ ...driverForm, bloodGroup: event.target.value })
                    }
                  />
                </label>
                <label className={styles.label}>
                  License No
                  <input
                    className={styles.input}
                    value={driverForm.licenseNo}
                    onChange={(event) =>
                      setDriverForm({ ...driverForm, licenseNo: event.target.value })
                    }
                  />
                </label>
                <label className={styles.label}>
                  Active
                  <select
                    className={styles.input}
                    value={driverForm.active ? "yes" : "no"}
                    onChange={(event) =>
                      setDriverForm({
                        ...driverForm,
                        active: event.target.value === "yes",
                      })
                    }
                  >
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </label>
              </div>
              <button
                className={styles.button}
                type="button"
                onClick={() =>
                  saveEntity(
                    driverForm.id
                      ? `/api/transport/drivers/${driverForm.id}`
                      : "/api/transport/drivers",
                    driverForm.id ? "PUT" : "POST",
                    driverForm
                  ).then(() => {
                    setDriverForm({
                      id: 0,
                      name: "",
                      phone: "",
                      alternatePhone: "",
                      bloodGroup: "",
                      licenseNo: "",
                      active: true,
                    });
                    setSelectedTransportEmployeeId("");
                  })
                }
              >
                {driverForm.id ? "Update Driver" : "Save Driver"}
              </button>
              <div className={styles.tableResponsive}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Phone</th>
                      <th>Alt Phone</th>
                      <th>Blood Group</th>
                      <th>License</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drivers.map((driver, index) => (
                      <tr key={driver.id}>
                        <td>{index + 1}</td>
                        <td>{driver.name}</td>
                        <td>{driver.phone}</td>
                        <td>{driver.alternatePhone || "-"}</td>
                        <td>{driver.bloodGroup || "-"}</td>
                        <td>{driver.licenseNo || "-"}</td>
                        <td>{driver.active ? "Active" : "Inactive"}</td>
                        <td className={styles.actionRow}>
                          <button
                            className={styles.inlineButton}
                            type="button"
                            onClick={() => setDriverForm(driver)}
                          >
                            Edit
                          </button>
                          <button
                            className={styles.inlineButton}
                            type="button"
                            onClick={() => deleteEntity(`/api/transport/drivers/${driver.id}`)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}

          {activeTransportTab === "Setup" && activeSetupTab === "Stoppage Master" ? (
            <>
              <div className={styles.sectionTitle}>Stoppage Master</div>
              <div className={styles.fieldRow}>
                <label className={styles.label}>
                  Route
                  <select
                    className={styles.input}
                    value={stoppageForm.routeName}
                    onChange={(event) =>
                      setStoppageForm({
                        ...stoppageForm,
                        routeName: event.target.value,
                      })
                    }
                  >
                    <option value="">Select</option>
                    {routeNames.map((route) => (
                      <option key={route} value={route}>
                        {route}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={styles.label}>
                  Stop Name
                  <input
                    className={styles.input}
                    value={stoppageForm.stopName}
                    onChange={(event) =>
                      setStoppageForm({
                        ...stoppageForm,
                        stopName: event.target.value,
                      })
                    }
                  />
                </label>
                <label className={styles.label}>
                  Check-in Time
                  <input
                    className={styles.input}
                    type="time"
                    value={stoppageForm.checkInTime}
                    onChange={(event) =>
                      setStoppageForm({
                        ...stoppageForm,
                        checkInTime: event.target.value,
                      })
                    }
                  />
                </label>
                <label className={styles.label}>
                  Check-out Time
                  <input
                    className={styles.input}
                    type="time"
                    value={stoppageForm.checkOutTime}
                    onChange={(event) =>
                      setStoppageForm({
                        ...stoppageForm,
                        checkOutTime: event.target.value,
                      })
                    }
                  />
                </label>
                <label className={styles.label}>
                  Amount
                  <input
                    className={styles.input}
                    type="number"
                    value={stoppageForm.feeAmount}
                    onChange={(event) =>
                      setStoppageForm({
                        ...stoppageForm,
                        feeAmount: Number(event.target.value),
                      })
                    }
                  />
                </label>
                <label className={styles.label}>
                  Distance (KM)
                  <input
                    className={styles.input}
                    type="number"
                    value={stoppageForm.distanceKm}
                    onChange={(event) =>
                      setStoppageForm({
                        ...stoppageForm,
                        distanceKm: Number(event.target.value),
                      })
                    }
                  />
                </label>
                <label className={styles.label}>
                  Active
                  <select
                    className={styles.input}
                    value={stoppageForm.active ? "yes" : "no"}
                    onChange={(event) =>
                      setStoppageForm({
                        ...stoppageForm,
                        active: event.target.value === "yes",
                      })
                    }
                  >
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </label>
              </div>
              <button
                className={styles.button}
                type="button"
                onClick={() =>
                  saveEntity(
                    stoppageForm.id
                      ? `/api/transport/stoppages/${stoppageForm.id}`
                      : "/api/transport/stoppages",
                    stoppageForm.id ? "PUT" : "POST",
                    stoppageForm
                  ).then(() =>
                    setStoppageForm({
                      id: 0,
                      routeName: "",
                      stopName: "",
                      checkInTime: "",
                      checkOutTime: "",
                      feeAmount: 0,
                      distanceKm: 0,
                      active: true,
                    })
                  )
                }
              >
                {stoppageForm.id ? "Update Stoppage" : "Save Stoppage"}
              </button>
              <div className={styles.tableResponsive}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Route</th>
                      <th>Stop</th>
                      <th>Check-in</th>
                      <th>Check-out</th>
                      <th>Amount</th>
                      <th>Distance</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stoppages.map((stop, index) => (
                      <tr key={stop.id}>
                        <td>{index + 1}</td>
                        <td>{stop.routeName}</td>
                        <td>{stop.stopName}</td>
                        <td>{stop.checkInTime}</td>
                        <td>{stop.checkOutTime}</td>
                        <td>{stop.feeAmount ?? "-"}</td>
                        <td>{stop.distanceKm ?? "-"}</td>
                        <td>{stop.active ? "Active" : "Inactive"}</td>
                        <td className={styles.actionRow}>
                          <button
                            className={styles.inlineButton}
                            type="button"
                            onClick={() => setStoppageForm(stop)}
                          >
                            Edit
                          </button>
                          <button
                            className={styles.inlineButton}
                            type="button"
                            onClick={() => deleteEntity(`/api/transport/stoppages/${stop.id}`)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}

          {activeTransportTab === "Setup" && activeSetupTab === "Assign Vehicle" ? (
            <>
              <div className={styles.sectionTitle}>Assign Vehicle</div>
              <div className={styles.fieldRow}>
                <label className={styles.label}>
                  Route
                  <select
                    className={styles.input}
                    value={assignmentForm.routeName}
                    onChange={(event) =>
                      setAssignmentForm({
                        ...assignmentForm,
                        routeName: event.target.value,
                      })
                    }
                  >
                    <option value="">Select</option>
                    {routeNames.map((route) => (
                      <option key={route} value={route}>
                        {route}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={styles.label}>
                  Vehicle No
                  <select
                    className={styles.input}
                    value={assignmentForm.vehicleNo}
                    onChange={(event) =>
                      setAssignmentForm({
                        ...assignmentForm,
                        vehicleNo: event.target.value,
                      })
                    }
                  >
                    <option value="">Select</option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.vehicleNo}>
                        {vehicle.vehicleNo}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={styles.label}>
                  Driver
                  <select
                    className={styles.input}
                    value={assignmentForm.driverId || ""}
                    onChange={(event) =>
                      setAssignmentForm({
                        ...assignmentForm,
                        driverId: Number(event.target.value),
                      })
                    }
                  >
                    <option value="">Select</option>
                    {driverOptions.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.name} ({driver.phone})
                      </option>
                    ))}
                  </select>
                </label>
                <label className={styles.label}>
                  Active
                  <select
                    className={styles.input}
                    value={assignmentForm.active ? "yes" : "no"}
                    onChange={(event) =>
                      setAssignmentForm({
                        ...assignmentForm,
                        active: event.target.value === "yes",
                      })
                    }
                  >
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </label>
              </div>
              <button
                className={styles.button}
                type="button"
                onClick={() =>
                  saveEntity(
                    assignmentForm.id
                      ? `/api/transport/assignments/${assignmentForm.id}`
                      : "/api/transport/assignments",
                    assignmentForm.id ? "PUT" : "POST",
                    assignmentForm
                  ).then(() =>
                    setAssignmentForm({
                      id: 0,
                      routeName: "",
                      vehicleNo: "",
                      driverId: 0,
                      active: true,
                    })
                  )
                }
              >
                {assignmentForm.id ? "Update Assignment" : "Save Assignment"}
              </button>
              <div className={styles.tableResponsive}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Route</th>
                      <th>Vehicle</th>
                      <th>Driver</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map((assignment, index) => {
                      const driver = drivers.find(
                        (item) => item.id === assignment.driverId
                      );
                      return (
                        <tr key={assignment.id}>
                          <td>{index + 1}</td>
                          <td>{assignment.routeName}</td>
                          <td>{assignment.vehicleNo}</td>
                          <td>{driver ? `${driver.name} (${driver.phone})` : "-"}</td>
                          <td>{assignment.active ? "Active" : "Inactive"}</td>
                          <td className={styles.actionRow}>
                            <button
                              className={styles.inlineButton}
                              type="button"
                              onClick={() => setAssignmentForm(assignment)}
                            >
                              Edit
                            </button>
                            <button
                              className={styles.inlineButton}
                              type="button"
                              onClick={() =>
                                deleteEntity(`/api/transport/assignments/${assignment.id}`)
                              }
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
