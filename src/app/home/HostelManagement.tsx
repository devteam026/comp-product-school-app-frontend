"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "../styles/home.module.css";
import { apiUrl } from "../../lib/api";

const hostelTypes = ["BOYS", "GIRLS", "MIXED"] as const;
const roomTypes = ["SINGLE", "DOUBLE", "DORM"] as const;
const roomStatuses = ["AVAILABLE", "FULL", "MAINTENANCE"] as const;
const allocationStatuses = ["ACTIVE", "VACATED"] as const;
const hostelTabs = ["Summary", "Hostel Master", "Allocations"] as const;

type Hostel = {
  id: number;
  name: string;
  type: string;
  capacity?: number;
  wardenId?: number | null;
  contactNumber?: string;
  address?: string;
  schoolId?: number | null;
};

type HostelRoom = {
  id: number;
  hostelId: number;
  roomNumber: string;
  floor?: number | null;
  roomType?: string;
  capacity?: number | null;
  currentOccupancy?: number | null;
  status?: string;
};

type HostelAllocation = {
  id: number;
  studentId: string;
  hostelId: number;
  roomId: number;
  bedNumber?: string;
  allocationDate?: string;
  vacateDate?: string;
  status?: string;
};

type Employee = {
  id: number;
  firstName: string;
  middleName?: string;
  lastName: string;
  department?: string;
};

type Student = {
  id: string;
  name: string;
  classCode?: string;
  registerNo?: string;
};

type HostelManagementProps = {
  activeClassCode?: string;
};

export default function HostelManagement({ activeClassCode }: HostelManagementProps) {
  const [activeTab, setActiveTab] = useState<(typeof hostelTabs)[number]>("Summary");
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [rooms, setRooms] = useState<HostelRoom[]>([]);
  const [allocations, setAllocations] = useState<HostelAllocation[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);

  const [hostelForm, setHostelForm] = useState({
    id: 0,
    name: "",
    type: "BOYS",
    capacity: 0,
    wardenId: 0,
    contactNumber: "",
    address: "",
    schoolId: 0,
  });
  const [roomForm, setRoomForm] = useState({
    id: 0,
    hostelId: 0,
    roomNumber: "",
    floor: 0,
    roomType: "SINGLE",
    capacity: 0,
    currentOccupancy: 0,
    status: "AVAILABLE",
  });
  const [allocationForm, setAllocationForm] = useState({
    id: 0,
    studentId: "",
    hostelId: 0,
    roomId: 0,
    bedNumber: "",
    allocationDate: "",
    vacateDate: "",
    status: "ACTIVE",
  });
  const [roomSearch, setRoomSearch] = useState("");
  const [roomHostelFilter, setRoomHostelFilter] = useState("all");
  const [roomStatusFilter, setRoomStatusFilter] = useState("all");
  const [roomTypeFilter, setRoomTypeFilter] = useState("all");
  const [roomPage, setRoomPage] = useState(1);
  const [roomPageSize, setRoomPageSize] = useState(25);
  const [selectedHostelId, setSelectedHostelId] = useState<number | null>(null);
  const [hostelStudentSearch, setHostelStudentSearch] = useState("");
  const [hostelStudentPage, setHostelStudentPage] = useState(1);
  const [hostelStudentPageSize, setHostelStudentPageSize] = useState(25);
  const [allocationSearch, setAllocationSearch] = useState("");
  const [allocationPage, setAllocationPage] = useState(1);
  const [allocationPageSize, setAllocationPageSize] = useState(25);
  const [allocationError, setAllocationError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveMessageType, setSaveMessageType] = useState<"success" | "error">("success");

  const showSaveMessage = (text: string, type: "success" | "error" = "success") => {
    setSaveMessage(text);
    setSaveMessageType(type);
    setTimeout(() => setSaveMessage(null), 4000);
  };

  const token = typeof window !== "undefined" ? window.localStorage.getItem("authToken") : null;
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  const loadAll = async () => {
    setLoading(true);
    const fetchJson = async (url: string) => {
      const res = await fetch(apiUrl(url), { headers });
      return res.ok ? res.json() : [];
    };
    const [hostelsData, roomsData, allocationData, employeesData, studentsData] = await Promise.all([
      fetchJson("/api/hostels/manage"),
      fetchJson("/api/hostels/manage/rooms"),
      fetchJson("/api/hostels/manage/allocations"),
      fetchJson("/api/employees"),
      fetchJson("/api/students"),
    ]);
    setHostels(hostelsData || []);
    setRooms(roomsData || []);
    setAllocations(allocationData || []);
    setEmployees(employeesData || []);
    setStudents(studentsData || []);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const hostelMap = useMemo(() => {
    const map = new Map<number, Hostel>();
    hostels.forEach((hostel) => map.set(hostel.id, hostel));
    return map;
  }, [hostels]);

  const roomMap = useMemo(() => {
    const map = new Map<number, HostelRoom>();
    rooms.forEach((room) => map.set(room.id, room));
    return map;
  }, [rooms]);

  const studentMap = useMemo(() => {
    const map = new Map<string, Student>();
    students.forEach((student) => {
      map.set(student.id, student);
    });
    return map;
  }, [students]);

  const summaryRows = useMemo(() => {
    return hostels.map((hostel) => {
      const hostelRooms = rooms.filter((room) => room.hostelId === hostel.id);
      const totalRoomCapacity = hostelRooms.reduce(
        (sum, room) => sum + (room.capacity ?? 0),
        0
      );
      const totalOccupied = hostelRooms.reduce(
        (sum, room) => sum + (room.currentOccupancy ?? 0),
        0
      );
      const allocationCount = allocations.filter(
        (allocation) => allocation.hostelId === hostel.id && allocation.status === "ACTIVE"
      ).length;
      return {
        id: hostel.id,
        name: hostel.name,
        type: hostel.type,
        capacity: hostel.capacity ?? "-",
        rooms: hostelRooms.length,
        bedCapacity: totalRoomCapacity,
        occupied: totalOccupied,
        available: Math.max(0, totalRoomCapacity - totalOccupied),
        allocations: allocationCount,
      };
    });
  }, [hostels, rooms, allocations]);

  // Show all employees as potential wardens — not just those with "hostel" in their department,
  // since most schools won't label any department exactly that way.
  const wardenOptions = useMemo(() => employees, [employees]);


  const hostelStudentRows = useMemo(() => {
    if (!selectedHostelId) return [];
    return allocations
      .filter((allocation) => allocation.hostelId === selectedHostelId)
      .map((allocation) => {
        const student = studentMap.get(allocation.studentId);
        const room = roomMap.get(allocation.roomId);
        return {
          id: allocation.id,
          studentName: student?.name ?? allocation.studentId,
          classCode: student?.classCode ?? "",
          registerNo: student?.registerNo ?? "",
          roomNumber: room?.roomNumber ?? "",
          bedNumber: allocation.bedNumber ?? "",
          status: allocation.status ?? "",
          allocationDate: allocation.allocationDate ?? "",
          vacateDate: allocation.vacateDate ?? "",
        };
      });
  }, [allocations, selectedHostelId, studentMap, roomMap]);

  const filteredHostelStudents = useMemo(() => {
    const query = hostelStudentSearch.trim().toLowerCase();
    if (!query) return hostelStudentRows;
    return hostelStudentRows.filter((row) => {
      return (
        row.studentName.toLowerCase().includes(query) ||
        row.classCode.toLowerCase().includes(query) ||
        row.registerNo.toLowerCase().includes(query) ||
        row.roomNumber.toLowerCase().includes(query) ||
        row.status.toLowerCase().includes(query)
      );
    });
  }, [hostelStudentRows, hostelStudentSearch]);

  const hostelStudentTotalPages = Math.max(
    1,
    Math.ceil(filteredHostelStudents.length / hostelStudentPageSize)
  );
  const pagedHostelStudents = filteredHostelStudents.slice(
    (hostelStudentPage - 1) * hostelStudentPageSize,
    hostelStudentPage * hostelStudentPageSize
  );

  useEffect(() => {
    setHostelStudentPage(1);
  }, [hostelStudentSearch, hostelStudentPageSize, selectedHostelId]);

  const allocationRows = useMemo(() => {
    return allocations.map((allocation) => {
      const student = studentMap.get(allocation.studentId);
      const room = roomMap.get(allocation.roomId);
      const hostel = hostelMap.get(allocation.hostelId);
      return {
        id: allocation.id,
        studentName: student?.name ?? allocation.studentId,
        classCode: student?.classCode ?? "",
        hostelName: hostel?.name ?? allocation.hostelId,
        roomNumber: room?.roomNumber ?? "",
        bedNumber: allocation.bedNumber ?? "",
        allocationDate: allocation.allocationDate ?? "",
        vacateDate: allocation.vacateDate ?? "",
        status: allocation.status ?? "",
      };
    });
  }, [allocations, studentMap, roomMap, hostelMap]);

  const filteredAllocations = useMemo(() => {
    const query = allocationSearch.trim().toLowerCase();
    if (!query) return allocationRows;
    return allocationRows.filter((row) => {
      return (
        row.studentName.toLowerCase().includes(query) ||
        row.classCode.toLowerCase().includes(query) ||
        row.hostelName.toString().toLowerCase().includes(query) ||
        row.roomNumber.toLowerCase().includes(query) ||
        row.status.toLowerCase().includes(query)
      );
    });
  }, [allocationRows, allocationSearch]);

  const allocationTotalPages = Math.max(
    1,
    Math.ceil(filteredAllocations.length / allocationPageSize)
  );
  const pagedAllocations = filteredAllocations.slice(
    (allocationPage - 1) * allocationPageSize,
    allocationPage * allocationPageSize
  );

  useEffect(() => {
    setAllocationPage(1);
  }, [allocationSearch, allocationPageSize]);

  const filteredRooms = useMemo(() => {
    const query = roomSearch.trim().toLowerCase();
    return rooms.filter((room) => {
      const hostelName = hostelMap.get(room.hostelId)?.name ?? "";
      const matchesQuery =
        !query ||
        room.roomNumber.toLowerCase().includes(query) ||
        hostelName.toLowerCase().includes(query) ||
        String(room.floor ?? "").includes(query);
      const matchesHostel =
        roomHostelFilter === "all" ||
        String(room.hostelId) === roomHostelFilter;
      const matchesStatus =
        roomStatusFilter === "all" ||
        (room.status ?? "").toLowerCase() === roomStatusFilter;
      const matchesType =
        roomTypeFilter === "all" ||
        (room.roomType ?? "").toLowerCase() === roomTypeFilter;
      return matchesQuery && matchesHostel && matchesStatus && matchesType;
    });
  }, [rooms, roomSearch, roomHostelFilter, roomStatusFilter, roomTypeFilter, hostelMap]);

  const roomTotalPages = Math.max(1, Math.ceil(filteredRooms.length / roomPageSize));
  const pagedRooms = filteredRooms.slice(
    (roomPage - 1) * roomPageSize,
    roomPage * roomPageSize
  );

  useEffect(() => {
    setRoomPage(1);
  }, [roomSearch, roomHostelFilter, roomStatusFilter, roomTypeFilter, roomPageSize]);

  const filteredStudents = useMemo(() => {
    if (!activeClassCode || activeClassCode === "all") return students;
    return students.filter((student) => student.classCode === activeClassCode);
  }, [students, activeClassCode]);

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
      await loadAll();
      return { ok: true as const };
    }
    const err = await response.json().catch(() => ({}));
    return { ok: false as const, error: err?.error ?? err?.message ?? "Save failed" };
  };

  const deleteEntity = async (url: string) => {
    const response = await fetch(apiUrl(url), { method: "DELETE", headers });
    if (response.ok) {
      loadAll();
    }
  };

  return (
    <div>
      <div className={styles.tabs}>
        {hostelTabs.map((tab) => (
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

      {loading ? (
        <div className={styles.loadingCard}>
          <div className={styles.skeletonTitle} />
          <div className={styles.skeletonLine} />
          <div className={styles.skeletonLine} />
        </div>
      ) : (
        <div className={styles.form}>
          {activeTab === "Summary" ? (
            <>
              <div className={styles.sectionTitle}>Hostel Summary</div>
              <div className={styles.tableResponsive}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Hostel Capacity</th>
                      <th>Rooms</th>
                      <th>Bed Capacity</th>
                      <th>Occupied</th>
                      <th>Available</th>
                      <th>Active Allocations</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaryRows.length === 0 ? (
                      <tr>
                        <td colSpan={9}>No hostels found.</td>
                      </tr>
                    ) : (
                      summaryRows.map((row, index) => (
                        <tr key={row.id}>
                          <td>{index + 1}</td>
                          <td className={styles.rowClickable} onClick={() => setSelectedHostelId(row.id)}>{row.name}</td>
                          <td>{row.type}</td>
                          <td>{row.capacity}</td>
                          <td>{row.rooms}</td>
                          <td>{row.bedCapacity}</td>
                          <td>{row.occupied}</td>
                          <td>{row.available}</td>
                          <td>{row.allocations}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}

          {selectedHostelId ? (
            <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
              <div className={styles.modalCard}>
                <div className={styles.modalHeader}>
                  <div>
                    <h3>
                      Students in {hostelMap.get(selectedHostelId)?.name ?? "Hostel"}
                    </h3>
                    <p className={styles.modalSubtitle}>
                      Total {filteredHostelStudents.length} allocations
                    </p>
                  </div>
                  <button
                    className={styles.inlineButton}
                    type="button"
                    onClick={() => setSelectedHostelId(null)}
                  >
                    Close
                  </button>
                </div>
                <div className={styles.modalStack}>
                  <div className={styles.listToolbar}>
                    <input
                      className={styles.searchInput}
                      type="search"
                      placeholder="Search student, class, room..."
                      value={hostelStudentSearch}
                      onChange={(event) => setHostelStudentSearch(event.target.value)}
                    />
                  </div>
                  <div className={styles.tableResponsive}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Student</th>
                          <th>Class</th>
                          <th>Register #</th>
                          <th>Room</th>
                          <th>Bed</th>
                          <th>Status</th>
                          <th>Allocated</th>
                          <th>Vacate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedHostelStudents.length === 0 ? (
                          <tr>
                            <td colSpan={9}>No students assigned.</td>
                          </tr>
                        ) : (
                          pagedHostelStudents.map((row, index) => (
                            <tr key={row.id}>
                              <td>
                                {(hostelStudentPage - 1) * hostelStudentPageSize + index + 1}
                              </td>
                              <td>{row.studentName}</td>
                              <td>{row.classCode || "-"}</td>
                              <td>{row.registerNo || "-"}</td>
                              <td>{row.roomNumber || "-"}</td>
                              <td>{row.bedNumber || "-"}</td>
                              <td>{row.status || "-"}</td>
                              <td>{row.allocationDate || "-"}</td>
                              <td>{row.vacateDate || "-"}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className={styles.pagination}>
                    <div>
                      Page {hostelStudentPage} of {hostelStudentTotalPages}
                    </div>
                    <div className={styles.paginationControls}>
                      <button
                        className={styles.inlineButton}
                        type="button"
                        onClick={() => setHostelStudentPage(1)}
                        disabled={hostelStudentPage === 1}
                      >
                        First
                      </button>
                      <button
                        className={styles.inlineButton}
                        type="button"
                        onClick={() =>
                          setHostelStudentPage((prev) => Math.max(1, prev - 1))
                        }
                        disabled={hostelStudentPage === 1}
                      >
                        Prev
                      </button>
                      <button
                        className={styles.inlineButton}
                        type="button"
                        onClick={() =>
                          setHostelStudentPage((prev) =>
                            Math.min(hostelStudentTotalPages, prev + 1)
                          )
                        }
                        disabled={hostelStudentPage === hostelStudentTotalPages}
                      >
                        Next
                      </button>
                      <button
                        className={styles.inlineButton}
                        type="button"
                        onClick={() => setHostelStudentPage(hostelStudentTotalPages)}
                        disabled={hostelStudentPage === hostelStudentTotalPages}
                      >
                        Last
                      </button>
                      <select
                        className={styles.inlineSelect}
                        value={hostelStudentPageSize}
                        onChange={(event) =>
                          setHostelStudentPageSize(Number(event.target.value))
                        }
                      >
                        {[10, 25, 50].map((size) => (
                          <option key={size} value={size}>
                            {size} / page
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === "Hostel Master" ? (
            <>
             <div className={styles.sectionTitle}>Hostel Master</div>
              <div className={styles.fieldRow}>
                <label className={styles.label}>
                  Hostel Name
                  <input
                    className={styles.input}
                    value={hostelForm.name}
                    onChange={(event) =>
                      setHostelForm({ ...hostelForm, name: event.target.value })
                    }
                  />
                </label>
                <label className={styles.label}>
                  Type
                  <select
                    className={styles.input}
                    value={hostelForm.type}
                    onChange={(event) =>
                      setHostelForm({ ...hostelForm, type: event.target.value })
                    }
                  >
                    {hostelTypes.map((type) => (
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
                    value={hostelForm.capacity ?? 0}
                    onChange={(event) =>
                      setHostelForm({
                        ...hostelForm,
                        capacity: Number(event.target.value),
                      })
                    }
                  />
                </label>
                <label className={styles.label}>
                  Warden
                  <select
                    className={styles.input}
                    value={hostelForm.wardenId || ""}
                    onChange={(event) =>
                      setHostelForm({
                        ...hostelForm,
                        wardenId: Number(event.target.value),
                      })
                    }
                  >
                    <option value="">Select</option>
                    {wardenOptions.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} (ID {emp.id})
                      </option>
                    ))}
                  </select>
                </label>
                <label className={styles.label}>
                  Contact Number
                  <input
                    className={styles.input}
                    value={hostelForm.contactNumber ?? ""}
                    onChange={(event) =>
                      setHostelForm({
                        ...hostelForm,
                        contactNumber: event.target.value,
                      })
                    }
                  />
                </label>
                <label className={styles.label}>
                  Address
                  <input
                    className={styles.input}
                    value={hostelForm.address ?? ""}
                    onChange={(event) =>
                      setHostelForm({ ...hostelForm, address: event.target.value })
                    }
                  />
                </label>
              </div>
              {saveMessage ? (
                <div className={saveMessageType === "error" ? styles.error : styles.saveMessage}>
                  {saveMessage}
                </div>
              ) : null}
              <button
                className={styles.button}
                type="button"
                onClick={() => {
                  if (!hostelForm.name.trim()) {
                    showSaveMessage("Hostel name is required.", "error");
                    return;
                  }
                  // Sanitize: send null for 0 IDs so the DB doesn't receive invalid foreign key values
                  const body = {
                    ...hostelForm,
                    wardenId: hostelForm.wardenId || null,
                    schoolId: hostelForm.schoolId || null,
                  };
                  saveEntity(
                    hostelForm.id
                      ? `/api/hostels/manage/${hostelForm.id}`
                      : "/api/hostels/manage",
                    hostelForm.id ? "PUT" : "POST",
                    body
                  ).then((result) => {
                    if (result.ok) {
                      showSaveMessage(hostelForm.id ? "Hostel updated." : "Hostel saved.");
                      setHostelForm({ id: 0, name: "", type: "BOYS", capacity: 0, wardenId: 0, contactNumber: "", address: "", schoolId: 0 });
                    } else {
                      showSaveMessage(result.error ?? "Failed to save hostel.", "error");
                    }
                  });
                }}
              >
                {hostelForm.id ? "Update Hostel" : "Save Hostel"}
              </button>
              <div className={styles.tableResponsive}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Capacity</th>
                      <th>Warden</th>
                      <th>Contact</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hostels.map((hostel, index) => (
                      <tr key={hostel.id}>
                        <td>{index + 1}</td>
                        <td>{hostel.name}</td>
                        <td>{hostel.type}</td>
                        <td>{hostel.capacity ?? "-"}</td>
                        <td>{hostel.wardenId ?? "-"}</td>
                        <td>{hostel.contactNumber ?? "-"}</td>
                        <td className={styles.actionRow}>
                          <button
                            className={styles.inlineButton}
                            type="button"
                            onClick={() =>
                              setHostelForm({
                                id: hostel.id,
                                name: hostel.name,
                                type: hostel.type ?? "BOYS",
                                capacity: hostel.capacity ?? 0,
                                wardenId: hostel.wardenId ?? 0,
                                contactNumber: hostel.contactNumber ?? "",
                                address: hostel.address ?? "",
                                schoolId: hostel.schoolId ?? 0,
                              })
                            }
                          >
                            Edit
                          </button>
                          <button
                            className={styles.inlineButton}
                            type="button"
                            onClick={() => deleteEntity(`/api/hostels/manage/${hostel.id}`)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className={styles.sectionTitle}>Hostel Rooms</div>
              <div className={styles.fieldRow}>
                <label className={styles.label}>
                  Hostel
                  <select
                    className={styles.input}
                    value={roomForm.hostelId || ""}
                    onChange={(event) =>
                      setRoomForm({ ...roomForm, hostelId: Number(event.target.value) })
                    }
                  >
                    <option value="">Select</option>
                    {hostels.map((hostel) => (
                      <option key={hostel.id} value={hostel.id}>
                        {hostel.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={styles.label}>
                  Room Number
                  <input
                    className={styles.input}
                    value={roomForm.roomNumber}
                    onChange={(event) =>
                      setRoomForm({ ...roomForm, roomNumber: event.target.value })
                    }
                  />
                </label>
                <label className={styles.label}>
                  Floor
                  <input
                    className={styles.input}
                    type="number"
                    value={roomForm.floor ?? 0}
                    onChange={(event) =>
                      setRoomForm({ ...roomForm, floor: Number(event.target.value) })
                    }
                  />
                </label>
                <label className={styles.label}>
                  Room Type
                  <select
                    className={styles.input}
                    value={roomForm.roomType}
                    onChange={(event) => setRoomForm({ ...roomForm, roomType: event.target.value })}
                  >
                    {roomTypes.map((type) => (
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
                    value={roomForm.capacity ?? 0}
                    onChange={(event) =>
                      setRoomForm({ ...roomForm, capacity: Number(event.target.value) })
                    }
                  />
                </label>
                <label className={styles.label}>
                  Current Occupancy
                  <input
                    className={styles.input}
                    type="number"
                    value={roomForm.currentOccupancy ?? 0}
                    onChange={(event) =>
                      setRoomForm({
                        ...roomForm,
                        currentOccupancy: Number(event.target.value),
                      })
                    }
                  />
                </label>
                <label className={styles.label}>
                  Status
                  <select
                    className={styles.input}
                    value={roomForm.status}
                    onChange={(event) => setRoomForm({ ...roomForm, status: event.target.value })}
                  >
                    {roomStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <button
                className={styles.button}
                type="button"
                onClick={() =>
                  saveEntity(
                    roomForm.id
                      ? `/api/hostels/manage/rooms/${roomForm.id}`
                      : "/api/hostels/manage/rooms",
                    roomForm.id ? "PUT" : "POST",
                    roomForm
                  ).then((result) => {
                    if (result.ok) {
                      showSaveMessage(roomForm.id ? "Room updated." : "Room saved.");
                      setRoomForm({ id: 0, hostelId: 0, roomNumber: "", floor: 0, roomType: "SINGLE", capacity: 0, currentOccupancy: 0, status: "AVAILABLE" });
                    } else {
                      showSaveMessage(result.error ?? "Failed to save room.", "error");
                    }
                  })
                }
              >
                {roomForm.id ? "Update Room" : "Save Room"}
              </button>
              <div className={styles.filterRow}>
                <input
                  className={styles.searchInput}
                  type="search"
                  placeholder="Search room number, hostel, floor..."
                  value={roomSearch}
                  onChange={(event) => setRoomSearch(event.target.value)}
                  style={{ flex: 1, minWidth: 180 }}
                />
                <select
                  className={styles.inlineSelect}
                  value={roomHostelFilter}
                  onChange={(event) => setRoomHostelFilter(event.target.value)}
                >
                  <option value="all">All Hostels</option>
                  {hostels.map((hostel) => (
                    <option key={hostel.id} value={String(hostel.id)}>
                      {hostel.name}
                    </option>
                  ))}
                </select>
                <select
                  className={styles.inlineSelect}
                  value={roomTypeFilter}
                  onChange={(event) => setRoomTypeFilter(event.target.value)}
                >
                  <option value="all">All Types</option>
                  {roomTypes.map((type) => (
                    <option key={type} value={type.toLowerCase()}>{type}</option>
                  ))}
                </select>
                <select
                  className={styles.inlineSelect}
                  value={roomStatusFilter}
                  onChange={(event) => setRoomStatusFilter(event.target.value)}
                >
                  <option value="all">All Statuses</option>
                  {roomStatuses.map((status) => (
                    <option key={status} value={status.toLowerCase()}>{status}</option>
                  ))}
                </select>
              </div>
              <div className={styles.tableResponsive}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Hostel</th>
                      <th>Room</th>
                      <th>Floor</th>
                      <th>Type</th>
                      <th>Capacity</th>
                      <th>Occupancy</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedRooms.map((room, index) => (
                      <tr key={room.id}>
                        <td>{(roomPage - 1) * roomPageSize + index + 1}</td>
                        <td>{hostelMap.get(room.hostelId)?.name ?? room.hostelId}</td>
                        <td>{room.roomNumber}</td>
                        <td>{room.floor ?? "-"}</td>
                        <td>{room.roomType ?? "-"}</td>
                        <td>{room.capacity ?? "-"}</td>
                        <td>{room.currentOccupancy ?? "-"}</td>
                        <td>{room.status ?? "-"}</td>
                        <td className={styles.actionRow}>
                          <button
                            className={styles.inlineButton}
                            type="button"
                            onClick={() =>
                              setRoomForm({
                                id: room.id,
                                hostelId: room.hostelId,
                                roomNumber: room.roomNumber,
                                floor: room.floor ?? 0,
                                roomType: room.roomType ?? "SINGLE",
                                capacity: room.capacity ?? 0,
                                currentOccupancy: room.currentOccupancy ?? 0,
                                status: room.status ?? "AVAILABLE",
                              })
                            }
                          >
                            Edit
                          </button>
                          <button
                            className={styles.inlineButton}
                            type="button"
                            onClick={() => deleteEntity(`/api/hostels/manage/rooms/${room.id}`)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className={styles.pagination}>
                <div>
                  Page {roomPage} of {roomTotalPages}
                </div>
                <div className={styles.paginationControls}>
                  <button
                    className={styles.inlineButton}
                    type="button"
                    onClick={() => setRoomPage(1)}
                    disabled={roomPage === 1}
                  >
                    First
                  </button>
                  <button
                    className={styles.inlineButton}
                    type="button"
                    onClick={() => setRoomPage((prev) => Math.max(1, prev - 1))}
                    disabled={roomPage === 1}
                  >
                    Prev
                  </button>
                  <button
                    className={styles.inlineButton}
                    type="button"
                    onClick={() => setRoomPage((prev) => Math.min(roomTotalPages, prev + 1))}
                    disabled={roomPage === roomTotalPages}
                  >
                    Next
                  </button>
                  <button
                    className={styles.inlineButton}
                    type="button"
                    onClick={() => setRoomPage(roomTotalPages)}
                    disabled={roomPage === roomTotalPages}
                  >
                    Last
                  </button>
                  <select
                    className={styles.inlineSelect}
                    value={roomPageSize}
                    onChange={(event) => setRoomPageSize(Number(event.target.value))}
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
          ) : null}

          {activeTab === "Allocations" ? (
            <>
             
          <div className={styles.sectionTitle}>Hostel Allocations</div>
          <div className={styles.fieldRow}>
                <label className={styles.label}>
              Student
              <select
                className={styles.input}
                value={allocationForm.studentId || ""}
                onChange={(event) =>
                  setAllocationForm({
                    ...allocationForm,
                    studentId: event.target.value,
                  })
                }
              >
                <option value="">Select</option>
                {filteredStudents.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} ({student.classCode ?? ""})
                  </option>
                ))}
              </select>
            </label>
                <label className={styles.label}>
              Hostel
              <select
                className={styles.input}
                value={allocationForm.hostelId || ""}
                onChange={(event) =>
                  setAllocationForm({
                    ...allocationForm,
                    hostelId: Number(event.target.value),
                    roomId: 0,
                  })
                }
              >
                <option value="">Select</option>
                {hostels.map((hostel) => (
                  <option key={hostel.id} value={hostel.id}>
                    {hostel.name}
                  </option>
                ))}
              </select>
            </label>
                <label className={styles.label}>
              Room
              <select
                className={styles.input}
                value={allocationForm.roomId || ""}
                onChange={(event) =>
                  setAllocationForm({
                    ...allocationForm,
                    roomId: Number(event.target.value),
                  })
                }
              >
                <option value="">Select</option>
                {rooms
                  .filter((room) => {
                    if (allocationForm.hostelId && room.hostelId !== allocationForm.hostelId) {
                      return false;
                    }
                    const isFullByStatus =
                      room.status && room.status.toUpperCase() === "FULL";
                    const isFullByCapacity =
                      typeof room.capacity === "number" &&
                      typeof room.currentOccupancy === "number" &&
                      room.capacity > 0 &&
                      room.currentOccupancy >= room.capacity;
                    const isSelected = room.id === allocationForm.roomId;
                    return isSelected || (!isFullByStatus && !isFullByCapacity);
                  })
                  .map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.roomNumber}
                    </option>
                  ))}
              </select>
            </label>
                <label className={styles.label}>
              Bed Number
                  <input
                className={styles.input}
                value={allocationForm.bedNumber}
                onChange={(event) =>
                  setAllocationForm({ ...allocationForm, bedNumber: event.target.value })
                }
              />
            </label>
                <label className={styles.label}>
              Allocation Date
                  <input
                className={styles.input}
                type="date"
                value={allocationForm.allocationDate}
                onChange={(event) =>
                  setAllocationForm({ ...allocationForm, allocationDate: event.target.value })
                }
              />
            </label>
                <label className={styles.label}>
              Vacate Date
                  <input
                className={styles.input}
                type="date"
                value={allocationForm.vacateDate}
                onChange={(event) =>
                  setAllocationForm({ ...allocationForm, vacateDate: event.target.value })
                }
              />
            </label>
                <label className={styles.label}>
              Status
              <select
                className={styles.input}
                value={allocationForm.status}
                onChange={(event) =>
                  setAllocationForm({ ...allocationForm, status: event.target.value })
                }
              >
                {allocationStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className={styles.formActions}>
            <button
              className={styles.button}
              type="button"
              onClick={async () => {
                setAllocationError(null);
                const result = await saveEntity(
                  allocationForm.id
                    ? `/api/hostels/manage/allocations/${allocationForm.id}`
                    : "/api/hostels/manage/allocations",
                  allocationForm.id ? "PUT" : "POST",
                  allocationForm
                );
                if (result.ok) {
                  setAllocationForm({
                    id: 0,
                    studentId: "",
                    hostelId: 0,
                    roomId: 0,
                    bedNumber: "",
                    allocationDate: "",
                    vacateDate: "",
                    status: "ACTIVE",
                  });
                  setAllocationError(null);
                  showSaveMessage(allocationForm.id ? "Allocation updated." : "Allocation saved.");
                } else {
                  setAllocationError(result.error);
                  showSaveMessage(result.error ?? "Failed to save allocation.", "error");
                }
              }}
            >
              {allocationForm.id ? "Update Allocation" : "Save Allocation"}
            </button>
            {allocationForm.id ? (
              <button
                className={styles.inlineButton}
                type="button"
                onClick={() => {
                  setAllocationForm({
                    id: 0,
                    studentId: "",
                    hostelId: 0,
                    roomId: 0,
                    bedNumber: "",
                    allocationDate: "",
                    vacateDate: "",
                    status: "ACTIVE",
                  });
                  setAllocationError(null);
                }}
              >
                Cancel Edit
              </button>
            ) : null}
          </div>
          {allocationError ? (
            <div className={styles.error}>{allocationError}</div>
          ) : null}
          {saveMessage && !allocationError ? (
            <div className={saveMessageType === "error" ? styles.error : styles.saveMessage}>
              {saveMessage}
            </div>
          ) : null}
          <div className={styles.listToolbar}>
            <input
              className={styles.searchInput}
              type="search"
              placeholder="Search student, class, hostel, room..."
              value={allocationSearch}
              onChange={(event) => setAllocationSearch(event.target.value)}
            />
          </div>
          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student</th>
                  <th>Hostel</th>
                  <th>Room</th>
                  <th>Bed</th>
                  <th>Allocation</th>
                  <th>Vacate</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pagedAllocations.map((allocation, index) => (
                  <tr key={allocation.id}>
                    <td>{(allocationPage - 1) * allocationPageSize + index + 1}</td>
                    <td>{allocation.studentName}</td>
                    <td>{allocation.hostelName}</td>
                    <td>{allocation.roomNumber || "-"}</td>
                    <td>{allocation.bedNumber || "-"}</td>
                    <td>{allocation.allocationDate || "-"}</td>
                    <td>{allocation.vacateDate || "-"}</td>
                    <td>{allocation.status || "-"}</td>
                    <td className={styles.actionRow}>
                      <button
                        className={styles.inlineButton}
                        type="button"
                        onClick={() => {
                          const raw = allocations.find((item) => item.id === allocation.id);
                          if (!raw) return;
                          setAllocationError(null);
                          setAllocationForm({
                            id: raw.id,
                            studentId: raw.studentId ?? "",
                            hostelId: raw.hostelId ?? 0,
                            roomId: raw.roomId ?? 0,
                            bedNumber: raw.bedNumber ?? "",
                            allocationDate: raw.allocationDate ?? "",
                            vacateDate: raw.vacateDate ?? "",
                            status: raw.status ?? "ACTIVE",
                          });
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className={styles.inlineButton}
                        type="button"
                        onClick={() =>
                          deleteEntity(`/api/hostels/manage/allocations/${allocation.id}`)
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
          <div className={styles.pagination}>
            <div>
              Page {allocationPage} of {allocationTotalPages}
            </div>
            <div className={styles.paginationControls}>
              <button
                className={styles.inlineButton}
                type="button"
                onClick={() => setAllocationPage(1)}
                disabled={allocationPage === 1}
              >
                First
              </button>
              <button
                className={styles.inlineButton}
                type="button"
                onClick={() => setAllocationPage((prev) => Math.max(1, prev - 1))}
                disabled={allocationPage === 1}
              >
                Prev
              </button>
              <button
                className={styles.inlineButton}
                type="button"
                onClick={() =>
                  setAllocationPage((prev) => Math.min(allocationTotalPages, prev + 1))
                }
                disabled={allocationPage === allocationTotalPages}
              >
                Next
              </button>
              <button
                className={styles.inlineButton}
                type="button"
                onClick={() => setAllocationPage(allocationTotalPages)}
                disabled={allocationPage === allocationTotalPages}
              >
                Last
              </button>
              <select
                className={styles.inlineSelect}
                value={allocationPageSize}
                onChange={(event) => setAllocationPageSize(Number(event.target.value))}
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
          ) : null}
        </div>
      )}
    </div>
  );
}
