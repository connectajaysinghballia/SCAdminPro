"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import "./employee.css";
import Link from "next/link";
import SubNavbar from "../../components/SubNavbar";
import PrimaryNavbar from "../../components/PrimaryNavbar";
import { Employee, organizations, rvsfByOrganization, designations } from "../../types/employee";

const API_URL = "/api/employees";

export default function EmployeePortal() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<"employees" | "hierarchy">("employees");
  const [search, setSearch] = useState("");
  const [orgFilter, setOrgFilter] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showHierarchyModal, setShowHierarchyModal] = useState(false);

  // Unlink Confirmation Dialog State (2-step verification)
  const [unlinkTarget, setUnlinkTarget] = useState<{ childId: string; supId: string } | null>(null);
  const [showUnlinkStep2, setShowUnlinkStep2] = useState<boolean>(false);

  // Interactive Hierarchy Zoom, Drag & Live Line Drawing State
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [customPositions, setCustomPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [activeDraggingId, setActiveDraggingId] = useState<string | null>(null);

  // Real-time SVG Connection Lines State
  const [liveConnections, setLiveConnections] = useState<
    Array<{ key: string; childId: string; supId: string; x1: number; y1: number; x2: number; y2: number }>
  >([]);

  // Dynamic Rubber-band Line Drawing State
  const [drawingLine, setDrawingLine] = useState<{
    sourceId: string;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  const [formData, setFormData] = useState<Partial<Employee>>({});
  const [supervisorSelect, setSupervisorSelect] = useState<string>("none");
  const [dynamicOrgs, setDynamicOrgs] = useState<string[]>([]);
  const [dynamicDesignations, setDynamicDesignations] = useState<string[]>([]);

  const fetchDynamicOrgs = async () => {
    try {
      const res = await fetch("/api/organizations");
      const result = await res.json();
      if (result.success) {
        setDynamicOrgs(result.data.map((o: any) => o.name));
      }
    } catch (err) {
      console.error("Failed to fetch organizations:", err);
    }
  };

  const fetchDynamicDesignations = async () => {
    try {
      const res = await fetch("/api/designations");
      const result = await res.json();
      if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        const names = result.data.map((d: any) => d.designationName);
        setDynamicDesignations(names);
      } else {
        setDynamicDesignations(designations);
      }
    } catch (err) {
      console.error("Failed to fetch dynamic designations:", err);
      setDynamicDesignations(designations);
    }
  };

  useEffect(() => {
    fetchDynamicOrgs();
    fetchDynamicDesignations();
  }, []);

  const [toast, setToast] = useState({ show: false, title: "", message: "" });

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const showToast = (title: string, message: string) => {
    setToast({ show: true, title, message });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 2800);
  };

  const getEmpId = (e: Employee) => e._id as string;
  const selectedEmployee = useMemo(() => employees.find((e) => getEmpId(e) === selectedId) || null, [employees, selectedId]);
  const employeesById = useMemo(() => Object.fromEntries(employees.map((e) => [getEmpId(e), e])), [employees]);

  const fetchEmployees = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const res = await fetch(`${API_URL}?search=${encodeURIComponent(search)}&orgFilter=${encodeURIComponent(orgFilter)}`);
      const result = await res.json();
      if (result.success) {
        setEmployees(result.data);
        if (!silent) showToast("Refreshed", "Employee data updated from server.");
      } else {
        showToast("Error", result.error || "Failed to fetch employees.");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      showToast("Error", "Failed to fetch employees from server.");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEmployees(true);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchEmployees(true), 300);
    return () => clearTimeout(t);
  }, [search, orgFilter]);

  const stats = useMemo(() => ({
    total: employees.length,
    active: employees.filter((e) => e.status === "Active").length,
    linked: employees.filter((e) => e.supervisorId !== null).length,
  }), [employees]);

  const employeeLabel = (e: Employee) => `${e.firstName} ${e.lastName}`.trim();
  const safeFormatDate = (v?: string) => v ? v.split("T")[0] : "";

  // Calculate Real-Time SVG Connection Lines between Employee and Supervisor Nodes
  const updateConnectionLines = () => {
    const wrapper = document.querySelector(".hierarchy-zoom-wrapper");
    if (!wrapper) return;
    const wrapperRect = wrapper.getBoundingClientRect();

    const lines: Array<{ key: string; childId: string; supId: string; x1: number; y1: number; x2: number; y2: number }> = [];

    employees.forEach((emp) => {
      if (!emp.supervisorId) return;
      const childId = getEmpId(emp);
      const supId = emp.supervisorId;

      const childNodeEl = document.querySelector(`[data-emp-id="${childId}"]`);
      const supNodeEl = document.querySelector(`[data-emp-id="${supId}"]`);

      if (childNodeEl && supNodeEl) {
        const childRect = childNodeEl.getBoundingClientRect();
        const supRect = supNodeEl.getBoundingClientRect();

        // Start from Top Center of child box
        const x1 = (childRect.left + childRect.width / 2 - wrapperRect.left) / zoomLevel;
        const y1 = (childRect.top - wrapperRect.top + 10) / zoomLevel;

        // End at Bottom Center of supervisor box (where connector dot handle is)
        const x2 = (supRect.left + supRect.width / 2 - wrapperRect.left) / zoomLevel;
        const y2 = (supRect.bottom - wrapperRect.top - 2) / zoomLevel;

        lines.push({
          key: `${childId}->${supId}`,
          childId,
          supId,
          x1,
          y1,
          x2,
          y2
        });
      }
    });

    setLiveConnections(lines);
  };

  useEffect(() => {
    if (activeTab === "hierarchy") {
      updateConnectionLines();
      const t1 = setTimeout(updateConnectionLines, 80);
      const t2 = setTimeout(updateConnectionLines, 300);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [activeTab, employees, customPositions, zoomLevel]);

  useEffect(() => {
    if (activeTab === "hierarchy") {
      window.addEventListener("resize", updateConnectionLines);
      return () => window.removeEventListener("resize", updateConnectionLines);
    }
  }, [activeTab, zoomLevel]);

  // Handle Double Clicking a Connection Line to Trigger Unlink Dialog Flow
  const handleLineDoubleClick = (childId: string, supId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setUnlinkTarget({ childId, supId });
    setShowUnlinkStep2(false);
  };

  const handleConfirmFinalUnlink = async () => {
    if (!unlinkTarget) return;
    const { childId, supId } = unlinkTarget;
    const childEmp = employeesById[childId];
    const supEmp = employeesById[supId];

    try {
      const res = await fetch(`${API_URL}/${childId}/supervisor`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supervisorId: null })
      });
      const result = await res.json();
      if (result.success) {
        setEmployees((prev) =>
          prev.map((e) => (getEmpId(e) === childId ? { ...e, supervisorId: null } : e))
        );
        showToast(
          "Hierarchy Unlinked!",
          `Removed reporting line between ${childEmp ? employeeLabel(childEmp) : "employee"} and ${
            supEmp ? employeeLabel(supEmp) : "supervisor"
          }.`
        );
        setTimeout(updateConnectionLines, 100);
      } else {
        showToast("Error", result.error || "Failed to unlink supervisor.");
      }
    } catch (err) {
      showToast("Error", "Network or server error.");
    } finally {
      setUnlinkTarget(null);
      setShowUnlinkStep2(false);
    }
  };

  // Handlers
  const handleOpenEmployeeModal = (mode: "add" | "edit") => {
    setEditingId(mode === "edit" && selectedEmployee ? getEmpId(selectedEmployee) : null);
    const target = mode === "edit" ? selectedEmployee : null;
    const initialOrg = dynamicOrgs.length > 0 ? dynamicOrgs[0] : (organizations[0] || "");
    const initialRvsf = rvsfByOrganization[initialOrg]?.[0] || "";
    const activeDesigList = dynamicDesignations.length > 0 ? dynamicDesignations : designations;

    setFormData(target ? { 
      ...target,
      dob: safeFormatDate(target.dob)
    } : {
      organization: initialOrg,
      rvsf: initialRvsf,
      firstName: "", lastName: "", username: "", email: "", contact: "",
      designation: activeDesigList[0] || "", dob: "", status: "Active",
      passwordExpiry: new Date('9999-12-31').toISOString()
    });
    setShowEmployeeModal(true);
  };

  const handleSaveEmployee = async () => {
    const p = formData as Employee;
    const required = [
      ["organization", "Organization is required"], ["rvsf", "RVSF is required"],
      ["firstName", "First name is required"], ["lastName", "Last name is required"],
      ["username", "Username is required"], ["email", "Email is required"],
      ["contact", "Contact number is required"]
    ];

    for (const [key, msg] of required) {
      if (!p[key as keyof Employee]) {
        showToast("Validation error", msg);
        return;
      }
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) {
      showToast("Invalid email", "Enter a valid email address.");
      return;
    }
    if (!/^\d{10,15}$/.test(p.contact)) {
      showToast("Invalid contact number", "Use only digits and keep the number between 10 and 15 digits.");
      return;
    }

    const finalPayload = { ...p, username: p.username.toLowerCase() };
    if (!finalPayload.dob) delete finalPayload.dob;
    
    if (editingId && selectedEmployee && selectedEmployee.status !== finalPayload.status) {
      if (finalPayload.status === 'Inactive') {
        finalPayload.inactiveDate = new Date().toISOString();
      } else {
        finalPayload.activeDate = new Date().toISOString();
      }
    }

    try {
      let res;
      if (editingId) {
        res = await fetch(`${API_URL}/${editingId}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(finalPayload)
        });
      } else {
        res = await fetch(`${API_URL}`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(finalPayload)
        });
      }

      const result = await res.json();
      if (!result.success) {
        showToast("Error", result.error || "Failed to save employee.");
        return;
      }

      showToast("Success", editingId ? "Employee updated." : "Employee added successfully.");
      
      if (editingId) {
        setEmployees(employees.map(e => getEmpId(e) === editingId ? { ...e, ...result.data } : e));
      } else {
        setEmployees([result.data, ...employees]);
      }
      
      setSelectedId(null);
      setShowDrawer(false);
      setShowEmployeeModal(false);
    } catch (err) {
      showToast("Error", "Network or server error.");
    }
  };

  const handleDeleteEmployee = async () => {
    if (!selectedEmployee) {
      showToast("No employee selected", "Select an employee first.");
      return;
    }
    const id = getEmpId(selectedEmployee);
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      const result = await res.json();
      if (result.success) {
        showToast("Success", "Employee deactivated.");
        setEmployees(employees
          .map((e) => e.supervisorId === id ? { ...e, supervisorId: null } : e)
          .map((e) => getEmpId(e) === id ? { ...e, status: "Inactive" as const, inactiveDate: new Date().toISOString() } : e)
        );
      } else {
        showToast("Error", result.error || "Failed to deactivate employee.");
      }
    } catch (err) {
      showToast("Error", "Network or server error.");
    }
  };

  const handleReactivateEmployee = async () => {
    if (!selectedEmployee) {
      showToast("No employee selected", "Select an employee first.");
      return;
    }
    const id = getEmpId(selectedEmployee);
    try {
      const currentIsoTime = new Date().toISOString();
      const res = await fetch(`${API_URL}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Active", activeDate: currentIsoTime })
      });
      const result = await res.json();
      if (result.success) {
        showToast("Success", "Employee reactivated.");
        setEmployees(employees.map((e) => getEmpId(e) === id ? { ...e, ...result.data, activeDate: result.data.activeDate || currentIsoTime } : e));
      } else {
        showToast("Error", result.error || "Failed to reactivate employee.");
      }
    } catch (err) {
      showToast("Error", "Network or server error.");
    }
  };

  const handleOpenHierarchyModal = () => {
    if (!selectedEmployee) {
      showToast("No employee selected", "Select an employee first.");
      return;
    }
    setSupervisorSelect(selectedEmployee.supervisorId || "none");
    setShowHierarchyModal(true);
  };

  const handleSaveHierarchy = async () => {
    if (!selectedEmployee) return;
    const next = supervisorSelect === "none" ? null : supervisorSelect;
    const id = getEmpId(selectedEmployee);
    
    try {
      const res = await fetch(`${API_URL}/${id}/supervisor`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ supervisorId: next })
      });
      const result = await res.json();
      if (!result.success) {
        showToast("Hierarchy Error", result.error || "Failed to update hierarchy.");
        return;
      }
      
      setEmployees(employees.map((e) => getEmpId(e) === id ? { ...e, supervisorId: next } : e));
      setShowHierarchyModal(false);
      showToast("Success", "Supervisor mapped successfully.");
    } catch (err) {
      showToast("Error", "Network or server error.");
    }
  };

  // Node Drag & Move Event Handlers with Real-time SVG Connection Line Updates
  const handleNodeMouseDown = (empId: string, e: React.MouseEvent) => {
    if (e.button !== 0) return;
    
    const target = e.target as HTMLElement;
    if (target.classList.contains("node-connector-port") || target.closest(".node-connector-port")) return;

    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const initialPos = customPositions[empId] || { x: 0, y: 0 };

    setActiveDraggingId(empId);

    const onMouseMove = (moveEv: MouseEvent) => {
      const dx = (moveEv.clientX - startX) / zoomLevel;
      const dy = (moveEv.clientY - startY) / zoomLevel;
      setCustomPositions((prev) => ({
        ...prev,
        [empId]: { x: Math.round(initialPos.x + dx), y: Math.round(initialPos.y + dy) }
      }));
      requestAnimationFrame(updateConnectionLines);
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      setActiveDraggingId(null);
      updateConnectionLines();
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const handleNodeDoubleClick = (empId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCustomPositions((prev) => {
      const next = { ...prev };
      delete next[empId];
      return next;
    });
    setTimeout(updateConnectionLines, 50);
    showToast("Position Reset", "Reset node position on layout canvas.");
  };

  // Circle Connector Port (Dot) Line Drawing Handler
  const handlePortMouseDown = (empId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const wrapper = document.querySelector(".hierarchy-zoom-wrapper");
    if (!wrapper) return;
    const rect = wrapper.getBoundingClientRect();

    const startX = (e.clientX - rect.left) / zoomLevel;
    const startY = (e.clientY - rect.top) / zoomLevel;

    setDrawingLine({
      sourceId: empId,
      startX,
      startY,
      currentX: startX,
      currentY: startY
    });

    const onMouseMove = (moveEv: MouseEvent) => {
      const curX = (moveEv.clientX - rect.left) / zoomLevel;
      const curY = (moveEv.clientY - rect.top) / zoomLevel;
      setDrawingLine((prev) =>
        prev
          ? {
              ...prev,
              currentX: curX,
              currentY: curY
            }
          : null
      );
    };

    const onMouseUp = async (upEv: MouseEvent) => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);

      const elements = document.elementsFromPoint(upEv.clientX, upEv.clientY);
      let targetEmpId: string | null = null;

      for (const el of elements) {
        const nodeEl = el.closest("[data-emp-id]");
        if (nodeEl) {
          const idAttr = nodeEl.getAttribute("data-emp-id");
          if (idAttr) {
            targetEmpId = idAttr;
            break;
          }
        }
      }

      if (targetEmpId && targetEmpId !== empId) {
        const sourceEmp = employeesById[empId];
        const targetEmp = employeesById[targetEmpId];

        try {
          const res = await fetch(`${API_URL}/${empId}/supervisor`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ supervisorId: targetEmpId })
          });
          const result = await res.json();
          if (result.success) {
            setEmployees((prev) =>
              prev.map((e) => (getEmpId(e) === empId ? { ...e, supervisorId: targetEmpId } : e))
            );
            showToast(
              "Hierarchy Connected!",
              `Linked ${sourceEmp ? employeeLabel(sourceEmp) : "Employee"} under ${
                targetEmp ? employeeLabel(targetEmp) : "Supervisor"
              }!`
            );
            setTimeout(updateConnectionLines, 100);
          } else {
            showToast("Connection Error", result.error || "Failed to link supervisor.");
          }
        } catch (err) {
          showToast("Error", "Network or server error.");
        }
      }

      setDrawingLine(null);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  // Render Hierarchy Node recursively with circle connector port dot & line drawing
  const renderHierarchyNode = (employee: Employee, grouped: Record<string, Employee[]>, depth = 0) => {
    const id = getEmpId(employee);
    const children = grouped[id] || [];
    const pos = customPositions[id] || { x: 0, y: 0 };
    const isDragging = activeDraggingId === id;
    const isDrawingFromHere = drawingLine?.sourceId === id;

    return (
      <div key={id} className="hierarchy-item-wrap">
        <div
          className={`hierarchy-node ${isDragging ? "is-dragging" : ""}`}
          data-emp-id={id}
          style={{
            transform: pos.x !== 0 || pos.y !== 0 ? `translate(${pos.x}px, ${pos.y}px)` : undefined,
            zIndex: isDragging ? 99 : 10
          }}
          onMouseDown={(e) => handleNodeMouseDown(id, e)}
          onDoubleClick={(e) => handleNodeDoubleClick(id, e)}
          title="Drag to move • Double-click to reset position"
        >
          <div className="node-avatar">
            {employee.firstName[0]}{employee.lastName[0]}
          </div>
          <div className="node-info">
            <div className="name">{employeeLabel(employee)}</div>
            <div className="role">{employee.designation}</div>

            {/* Circle Connector Handle Port (Dot) */}
            <div
              className={`node-connector-port ${isDrawingFromHere ? "drawing" : ""}`}
              onMouseDown={(e) => handlePortMouseDown(id, e)}
              title="Click & Drag line from this dot onto a target box to connect supervisor"
            >
              <div className="connector-dot" />
            </div>
          </div>
        </div>
        {children.length > 0 && (
          <div className="hierarchy-level">
            {children.map((c) => renderHierarchyNode(c, grouped, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const groupedHierarchy = useMemo(() => {
    const grouped: Record<string, Employee[]> = {};
    employees.forEach((e) => {
      const key = e.supervisorId || "root";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(e);
    });
    return grouped;
  }, [employees]);

  return (
    <div className="employee-portal">
      {/* Centralized Primary Navbar with Mega Menu */}
      <PrimaryNavbar />

      {/* Shared Sub-Navbar */}
      <SubNavbar activeTab="Manage Account" currentPage="Manage Employees" />
      
      <div className="container">
        <section className="hero card">
          <div>
            <h1>ScrapCentre Employee Portal</h1>
            <div className="sub">Manage employees, access, and reporting hierarchy.</div>
          </div>
          <div className="actions">
            <button className="btn btn-primary" onClick={() => handleOpenEmployeeModal("add")}>＋ Add Employee</button>
            <button className="btn btn-secondary" onClick={handleOpenHierarchyModal}>🔗 Link Supervisor</button>
          </div>
        </section>

        <section className="stats">
          <div className="card stat">
             <div className="label">Total Employees</div>
             <div className="value">{stats.total}</div>
             <div className="sub-label">Employee master records</div>
          </div>
          <div className="card stat">
             <div className="label">Active Users</div>
             <div className="value">{stats.active}</div>
             <div className="sub-label">Portal-enabled accounts</div>
          </div>
          <div className="card stat">
             <div className="label">Hierarchy Linked</div>
             <div className="value">{stats.linked}</div>
             <div className="sub-label">Employees with supervisors</div>
          </div>
        </section>

        <section ref={panelRef} className={`grid ${selectedId ? "has-sidebar" : ""}`}>
          <aside className={`profile-sidebar ${showDrawer ? "open" : ""}`}>
            <button className="drawer-close-btn" onClick={() => { setShowDrawer(false); setSelectedId(null); }}>✕ Close</button>
            {!selectedEmployee ? (
               <div className="empty-profile">
                 <div className="empty-avatar"></div>
                 <h3>No employee selected</h3>
                 <p>Select an employee from the table to view their details.</p>
               </div>
            ) : (
               <div className="profile-content">
                  <div className="profile-header">
                    <div className="profile-avatar">
                      {selectedEmployee.firstName[0]}{selectedEmployee.lastName[0]}
                    </div>
                    <h2 className="title">{employeeLabel(selectedEmployee)}</h2>
                    <div className="desc">{selectedEmployee.designation}</div>
                    <div className="profile-tags">
                      <span className={`badge ${selectedEmployee.status === "Active" ? "active" : ""}`}>{selectedEmployee.status}</span>
                      <span className="badge tag">@{selectedEmployee.username}</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "10px", margin: "16px 0 20px" }}>
                    <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => handleOpenEmployeeModal("edit")}>
                      ✎ Edit Details
                    </button>
                    {selectedEmployee.status === "Inactive" ? (
                      <button className="btn btn-success" style={{ flex: 1 }} onClick={handleReactivateEmployee}>
                        ↻ Reactivate
                      </button>
                    ) : (
                      <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleDeleteEmployee}>
                        🗑 Deactivate
                      </button>
                    )}
                  </div>
                  
                  <div className="profile-sections">
                    <div className="profile-section">
                      <h4>Contact Info</h4>
                      <div className="info-row"><span>Email</span> <div style={{ wordBreak: 'break-all' }}>{selectedEmployee.email}</div></div>
                      <div className="info-row"><span>Phone</span> <div>{selectedEmployee.contact}</div></div>
                    </div>
                    
                    <div className="profile-section">
                      <h4>Organization</h4>
                      <div className="info-row"><span>Entity</span> <div style={{ textAlign: 'right' }}>{selectedEmployee.organization}</div></div>
                      <div className="info-row"><span>RVSF</span> <div>{selectedEmployee.rvsf}</div></div>
                    </div>
                    
                    <div className="profile-section">
                      <h4>Reporting</h4>
                      <div className="info-row">
                        <span>Supervisor</span> 
                        <div style={{ textAlign: 'right' }}>
                        {selectedEmployee.supervisorId && employeesById[selectedEmployee.supervisorId] 
                          ? employeeLabel(employeesById[selectedEmployee.supervisorId])
                          : "None"}
                        </div>
                      </div>
                    </div>
                    <div className="profile-section">
                      <h4>Status Timeline</h4>
                      <div className="info-row">
                        <span>Last Activated</span> 
                        <div style={{ textAlign: 'right', color: selectedEmployee.status === 'Active' ? '#10b981' : 'inherit', fontWeight: selectedEmployee.status === 'Active' ? '600' : '400' }}>
                          {selectedEmployee.activeDate 
                            ? new Date(selectedEmployee.activeDate).toLocaleDateString('en-IN') 
                            : (selectedEmployee.createdAt ? new Date(selectedEmployee.createdAt).toLocaleDateString('en-IN') : "—")}
                        </div>
                      </div>
                      <div className="info-row">
                        <span>Last Deactivated</span> 
                        <div style={{ textAlign: 'right', color: selectedEmployee.status === 'Inactive' ? '#ef4444' : 'inherit', fontWeight: selectedEmployee.status === 'Inactive' ? '600' : '400' }}>
                          {selectedEmployee.inactiveDate && !selectedEmployee.inactiveDate.startsWith('9999')
                            ? new Date(selectedEmployee.inactiveDate).toLocaleDateString('en-IN') 
                            : (selectedEmployee.status === 'Inactive' && selectedEmployee.updatedAt 
                                ? new Date(selectedEmployee.updatedAt).toLocaleDateString('en-IN') 
                                : "—")}
                        </div>
                      </div>
                    </div>
                  </div>
               </div>
            )}
          </aside>

          <div className={`card panel ${isFullscreen ? "fullscreen-table" : ""}`}>
            <div className="tabs">
              <button className={`tab ${activeTab === "employees" ? "active" : ""}`} onClick={() => setActiveTab("employees")}>Employees</button>
              <button className={`tab ${activeTab === "hierarchy" ? "active" : ""}`} onClick={() => setActiveTab("hierarchy")}>Hierarchy View</button>
            </div>

            {activeTab === "employees" && (
              <div id="employeesTab">
                <div className="panel-header">
                  <div>
                    <h2 className="title">Employee master</h2>
                    <div className="desc">Select a row to edit, delete, or assign a supervisor.</div>
                  </div>
                </div>

                <div className="toolbar">
                  <div className="search-wrap">
                    <span className="icon">🔍</span>
                    <input placeholder="Search API..." value={search} onChange={(e) => setSearch(e.target.value)} />
                  </div>

                  <select value={orgFilter} onChange={(e) => setOrgFilter(e.target.value)} style={{ width: 'auto', minWidth: '180px' }}>
                    <option value="all">All Organizations</option>
                    {dynamicOrgs.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-primary" onClick={() => handleOpenEmployeeModal("add")}>＋ Add</button>
                    <button className="btn btn-outline" onClick={() => selectedEmployee ? handleOpenEmployeeModal("edit") : showToast("Notice", "Select an employee first.")}>✎ Edit</button>
                    {selectedEmployee?.status === "Inactive" ? (
                      <button className="btn btn-success" onClick={handleReactivateEmployee}>↻ Reactivate</button>
                    ) : (
                      <button className="btn btn-danger" onClick={handleDeleteEmployee}>🗑 Deactivate</button>
                    )}
                  </div>
                  
                  <div style={{ width: 1, background: '#e2e8f0', height: 24, margin: '0 4px' }} />
                  
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-outline" onClick={handleOpenHierarchyModal}>🔗 Link Hierarchy</button>
                    <button 
                      className={`btn btn-outline ${isRefreshing ? "loading" : ""}`} 
                      onClick={() => fetchEmployees(false)}
                      disabled={isRefreshing}
                    >
                      {isRefreshing ? "⏳ Refreshing..." : "↻ Refresh"}
                    </button>
                  </div>

                  <button 
                    className="btn btn-outline" 
                    style={{ marginLeft: 'auto', fontWeight: '900', fontSize: '18px' }}
                    title={isFullscreen ? "Exit Full Screen" : "Full Screen"}
                    onClick={async () => {
                      if (!document.fullscreenElement) {
                        await panelRef.current?.requestFullscreen();
                      } else {
                        await document.exitFullscreen();
                      }
                    }}
                  >
                    {isFullscreen ? "↙" : "⛶"}
                  </button>
                </div>

                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th></th>
                        <th>Employee</th>
                        <th>User Name</th>
                        <th>Organization</th>
                        <th>RVSF</th>
                        <th>Email</th>
                        <th>Designation</th>
                        <th>Supervisor</th>
                        <th>Contact</th>
                        <th>Status</th>
                        <th>Activity Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees.map((e) => {
                        const id = getEmpId(e);
                        const sup = e.supervisorId ? employeesById[e.supervisorId] : null;
                        return (
                          <tr key={id} className={selectedId === id ? "selected" : ""} onClick={() => { if (selectedId === id) { setSelectedId(null); setShowDrawer(false); } else { setSelectedId(id); setShowDrawer(true); } }}>
                            <td><span className="radio"></span></td>
                            <td>
                              <strong>{employeeLabel(e)}</strong>
                              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{id}</div>
                            </td>
                            <td>@{e.username}</td>
                            <td>{e.organization}</td>
                            <td>{e.rvsf}</td>
                            <td>{e.email}</td>
                            <td>{e.designation}</td>
                            <td>{sup ? employeeLabel(sup) : "—"}</td>
                            <td>{e.contact}</td>
                            <td><span className={`badge ${e.status === "Active" ? "active" : ""}`}>{e.status}</span></td>
                            <td>
                              {e.status === "Active" 
                                ? (e.activeDate 
                                    ? new Date(e.activeDate).toLocaleDateString('en-IN') 
                                    : (e.createdAt ? new Date(e.createdAt).toLocaleDateString('en-IN') : "—"))
                                : (e.inactiveDate && !e.inactiveDate.startsWith('9999')
                                    ? new Date(e.inactiveDate).toLocaleDateString('en-IN') 
                                    : (e.updatedAt ? new Date(e.updatedAt).toLocaleDateString('en-IN') : "—"))}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="footer-note">
                  <div>Showing mapped records from server</div>
                  <div>{selectedEmployee ? `Selected: ${employeeLabel(selectedEmployee)}` : "No employee selected"}</div>
                </div>
              </div>
            )}

            {activeTab === "hierarchy" && (
              <div id="hierarchyTab">
                <div className="panel-header">
                  <div>
                    <h2 className="title">Employee hierarchy</h2>
                    <div className="desc">
                      Reporting structure live from MongoDB. Drag line to connect • Double-click line to unlink.
                    </div>
                  </div>
                </div>

                <div
                  className="hierarchy-linking-banner"
                  style={{ background: "#f8fafc", color: "#334155", border: "1px solid #cbd5e1" }}
                >
                  <div>
                    💡 <strong>Line Controls:</strong> Drag from circle dot handle (●) to connect • <strong>Double-click any line to unlink!</strong>
                  </div>
                </div>

                <div className="hierarchy-viewport-container">
                  {/* Floating Zoom & Position Controls */}
                  <div className="hierarchy-zoom-toolbar">
                    <button
                      className="hierarchy-zoom-btn"
                      title="Zoom Out"
                      onClick={() => setZoomLevel((prev) => Math.max(0.4, Number((prev - 0.15).toFixed(2))))}
                    >
                      🔍 -
                    </button>
                    <button
                      className="hierarchy-zoom-btn"
                      title="Reset Zoom to 100%"
                      onClick={() => setZoomLevel(1)}
                    >
                      {Math.round(zoomLevel * 100)}%
                    </button>
                    <button
                      className="hierarchy-zoom-btn"
                      title="Zoom In"
                      onClick={() => setZoomLevel((prev) => Math.min(1.8, Number((prev + 0.15).toFixed(2))))}
                    >
                      🔍 +
                    </button>
                    {Object.keys(customPositions).length > 0 && (
                      <button
                        className="hierarchy-zoom-btn"
                        style={{ background: "#fef2f2", color: "#dc2626", borderColor: "#fecaca" }}
                        title="Reset all node positions on layout"
                        onClick={() => {
                          setCustomPositions({});
                          setTimeout(updateConnectionLines, 50);
                          showToast("Layout Reset", "Reset all node positions.");
                        }}
                      >
                        ↺ Reset Positions
                      </button>
                    )}
                  </div>

                  <div
                    className="hierarchy-zoom-wrapper"
                    style={{ transform: `scale(${zoomLevel})` }}
                  >
                    {/* SVG Real-time Connections Overlay */}
                    <svg
                      className="hierarchy-svg-overlay"
                      style={{ width: "100%", height: "100%", position: "absolute", inset: 0, overflow: "visible" }}
                    >
                      <defs>
                        <marker
                          id="arrowhead"
                          viewBox="0 0 10 10"
                          refX="6"
                          refY="5"
                          markerWidth="6"
                          markerHeight="6"
                          orient="auto-start-reverse"
                        >
                          <path d="M 0 0 L 10 5 L 0 10 z" fill="#2563eb" />
                        </marker>
                      </defs>

                      {/* Render All Double-Clickable Real-Time Connection Lines */}
                      {liveConnections.map((line) => (
                        <g
                          key={line.key}
                          style={{ cursor: "pointer", pointerEvents: "all" }}
                          onDoubleClick={(e) => handleLineDoubleClick(line.childId, line.supId, e)}
                        >
                          {/* Invisible thick hit area for easy double clicking */}
                          <path
                            d={`M ${line.x1} ${line.y1} C ${line.x1} ${(line.y1 + line.y2) / 2}, ${line.x2} ${
                              (line.y1 + line.y2) / 2
                            }, ${line.x2} ${line.y2}`}
                            stroke="transparent"
                            strokeWidth="16"
                            fill="none"
                          />
                          {/* Outer glow line */}
                          <path
                            d={`M ${line.x1} ${line.y1} C ${line.x1} ${(line.y1 + line.y2) / 2}, ${line.x2} ${
                              (line.y1 + line.y2) / 2
                            }, ${line.x2} ${line.y2}`}
                            stroke="rgba(37, 99, 235, 0.2)"
                            strokeWidth="7"
                            fill="none"
                          />
                          {/* Main line */}
                          <path
                            d={`M ${line.x1} ${line.y1} C ${line.x1} ${(line.y1 + line.y2) / 2}, ${line.x2} ${
                              (line.y1 + line.y2) / 2
                            }, ${line.x2} ${line.y2}`}
                            stroke="#2563eb"
                            strokeWidth="2.5"
                            fill="none"
                            markerEnd="url(#arrowhead)"
                          />
                        </g>
                      ))}

                      {/* Render Rubber-band Dragging Connection Line */}
                      {drawingLine && (
                        <path
                          d={`M ${drawingLine.startX} ${drawingLine.startY} C ${drawingLine.startX} ${
                            (drawingLine.startY + drawingLine.currentY) / 2
                          }, ${drawingLine.currentX} ${
                            (drawingLine.startY + drawingLine.currentY) / 2
                          }, ${drawingLine.currentX} ${drawingLine.currentY}`}
                          stroke="#2563eb"
                          strokeWidth="3.5"
                          strokeDasharray="6 4"
                          fill="none"
                          markerEnd="url(#arrowhead)"
                        />
                      )}
                    </svg>

                    <div className="hierarchy-content">
                      <div className="hierarchy-level root">
                        {(!groupedHierarchy.root || groupedHierarchy.root.length === 0) ? (
                          <div className="mini-card">No hierarchy available yet.</div>
                        ) : (
                          groupedHierarchy.root.map((r) => renderHierarchyNode(r, groupedHierarchy, 0))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {toast.show && (
              <div className="toast show" style={{ display: "block" }}>
                <strong>{toast.title}</strong>
                <div>{toast.message}</div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Unlink Connection Step 1 Modal */}
      {unlinkTarget && !showUnlinkStep2 && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setUnlinkTarget(null);
          }}
        >
          <div className="modal modal-sm">
            <div className="modal-header">
              <div>
                <div className="modal-title">Unlink Reporting Connection</div>
                <div className="modal-sub">Do you want to disconnect this hierarchy line in MongoDB?</div>
              </div>
              <button className="close" onClick={() => setUnlinkTarget(null)}>
                ×
              </button>
            </div>
            <div className="form-grid" style={{ gridTemplateColumns: "1fr", paddingTop: 16 }}>
              <div className="notice" style={{ background: "#fef2f2", color: "#991b1b", borderColor: "#fecaca" }}>
                <strong>Disconnect Reporting Link:</strong>
                <div style={{ marginTop: 6 }}>
                  Employee:{" "}
                  <strong>
                    {employeesById[unlinkTarget.childId]
                      ? employeeLabel(employeesById[unlinkTarget.childId])
                      : "Employee"}
                  </strong>
                </div>
                <div style={{ marginTop: 2 }}>
                  Supervisor:{" "}
                  <strong>
                    {employeesById[unlinkTarget.supId]
                      ? employeeLabel(employeesById[unlinkTarget.supId])
                      : "Supervisor"}
                  </strong>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setUnlinkTarget(null)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={() => setShowUnlinkStep2(true)}>
                Unlink Connection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unlink Connection Step 2 Final Confirmation Modal */}
      {unlinkTarget && showUnlinkStep2 && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setUnlinkTarget(null);
              setShowUnlinkStep2(false);
            }
          }}
        >
          <div className="modal modal-sm">
            <div className="modal-header" style={{ borderBottomColor: "#fee2e2" }}>
              <div>
                <div className="modal-title" style={{ color: "#dc2626" }}>
                  ⚠️ Final Confirmation Required
                </div>
                <div className="modal-sub">Are you 100% sure you want to proceed?</div>
              </div>
              <button
                className="close"
                onClick={() => {
                  setUnlinkTarget(null);
                  setShowUnlinkStep2(false);
                }}
              >
                ×
              </button>
            </div>
            <div className="form-grid" style={{ gridTemplateColumns: "1fr", paddingTop: 16 }}>
              <div
                style={{
                  background: "#fff5f5",
                  border: "1.5px solid #feb2b2",
                  borderRadius: "10px",
                  padding: "16px",
                  fontSize: "13.5px",
                  lineHeight: "1.5",
                  color: "#7f1d1d"
                }}
              >
                <div>
                  This action will permanently remove the supervisor link for{" "}
                  <strong>
                    {employeesById[unlinkTarget.childId]
                      ? employeeLabel(employeesById[unlinkTarget.childId])
                      : "this employee"}
                  </strong>{" "}
                  and save changes live in MongoDB.
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowUnlinkStep2(false)}>
                ← Go Back
              </button>
              <button className="btn btn-danger" onClick={handleConfirmFinalUnlink}>
                Yes, Confirm Unlink
              </button>
            </div>
          </div>
        </div>
      )}

      {showEmployeeModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowEmployeeModal(false); }}>
          <div className="modal">
            <div className="modal-header">
              <div>
                <div className="modal-title">{editingId ? "Edit Employee" : "Add Employee"}</div>
                <div className="modal-sub">Create employee, portal user, and role assignment in one flow.</div>
              </div>
              <button className="close" onClick={() => setShowEmployeeModal(false)}>×</button>
            </div>
            <div className="notice">Required Server checks: Username & Email must be unique.</div>
            <div className="form-grid">
              <div className="field">
                <label>Organization Name <span className="req">*</span></label>
                <select value={formData.organization || ""} onChange={(e) => {
                  const org = e.target.value;
                  setFormData({ ...formData, organization: org, rvsf: rvsfByOrganization[org]?.[0] || "" });
                }}>
                  {dynamicOrgs.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div className="field">
                <label>RVSF Name <span className="req">*</span></label>
                <select value={formData.rvsf || ""} onChange={(e) => setFormData({ ...formData, rvsf: e.target.value })}>
                  {(rvsfByOrganization[formData.organization || dynamicOrgs[0] || ""] || []).map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="field"><label>First Name <span className="req">*</span></label><input value={formData.firstName || ""} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} /></div>
              <div className="field"><label>Last Name <span className="req">*</span></label><input value={formData.lastName || ""} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} /></div>
              <div className="field"><label>User Name <span className="req">*</span></label><input value={formData.username || ""} onChange={(e) => setFormData({ ...formData, username: e.target.value })} /></div>
              <div className="field"><label>Email ID <span className="req">*</span></label><input type="email" value={formData.email || ""} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
              <div className="field"><label>Contact Number <span className="req">*</span></label><input value={formData.contact || ""} onChange={(e) => setFormData({ ...formData, contact: e.target.value.replace(/\D/g, "") })} /></div>
              <div className="field">
                <label>Designation <span className="req">*</span></label>
                <select value={formData.designation || ""} onChange={(e) => setFormData({ ...formData, designation: e.target.value })}>
                  {(dynamicDesignations.length > 0 ? dynamicDesignations : designations).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="field"><label>Date of Birth</label><input type="date" value={formData.dob || ""} onChange={(e) => setFormData({ ...formData, dob: e.target.value })} /></div>
              <div className="field">
                <label>Status</label>
                <select value={formData.status || "Active"} onChange={(e) => setFormData({ ...formData, status: e.target.value as "Active" | "Inactive" })}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowEmployeeModal(false)}>Cancel</button>
              <button className="btn" style={{ background: "var(--primary)", color: "#fff" }} onClick={handleSaveEmployee}>{editingId ? "Update Employee" : "Save Employee"}</button>
            </div>
          </div>
        </div>
      )}

      {showHierarchyModal && selectedEmployee && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowHierarchyModal(false); }}>
          <div className="modal modal-sm">
            <div className="modal-header">
              <div>
                <div className="modal-title">Link hierarchy</div>
                <div className="modal-sub">Server checks for circular references during assignment.</div>
              </div>
              <button className="close" onClick={() => setShowHierarchyModal(false)}>×</button>
            </div>
            <div className="form-grid" style={{ gridTemplateColumns: "1fr", paddingTop: 10 }}>
              <div className="mini-card">
                <strong>{employeeLabel(selectedEmployee)}</strong>
                <div className="muted">{selectedEmployee.designation}</div>
                <div className="muted" style={{ marginTop: 8 }}>
                  Current supervisor: {selectedEmployee.supervisorId && employeesById[selectedEmployee.supervisorId]
                    ? employeeLabel(employeesById[selectedEmployee.supervisorId])
                    : "None / top level"}
                </div>
              </div>
              <div className="field">
                <label>Supervisor</label>
                <select value={supervisorSelect} onChange={(e) => setSupervisorSelect(e.target.value)}>
                  <option value="none">No supervisor / top level</option>
                  {employees.filter((e) => getEmpId(e) !== getEmpId(selectedEmployee)).map((e) => (
                    <option key={getEmpId(e)} value={getEmpId(e)}>{employeeLabel(e)} — {e.designation}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowHierarchyModal(false)}>Cancel</button>
              <button className="btn" style={{ background: "var(--primary)", color: "#fff" }} onClick={handleSaveHierarchy}>Save Link</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
