"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import "./employee.css";
import Link from "next/link";
import { Employee, organizations, rvsfByOrganization, designations } from "../../types/employee";

const API_URL = "/api/employees";

export default function EmployeePortal() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showMegaMenu, setShowMegaMenu] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<"employees" | "hierarchy">("employees");
  const [search, setSearch] = useState("");
  const [orgFilter, setOrgFilter] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showHierarchyModal, setShowHierarchyModal] = useState(false);

  const [formData, setFormData] = useState<Partial<Employee>>({});
  const [supervisorSelect, setSupervisorSelect] = useState<string>("none");
  const [dynamicOrgs, setDynamicOrgs] = useState<string[]>([]);

  const menuSections = [
    {
      title: "Manage Account",
      items: ["Manage Employees", "Manage Organization", "Manage Roles", "Manage RVSFs", "User Designations"]
    },
    {
      title: "Purchases",
      items: ["Manage ELV Leads", "Manage Approvals", "Manage Auctions", "Manage ELV Leads", "Manage Lead Logistics", "Manage Suppliers", "Manage Vehicle Purchases", "Purchase Payments Management (In Progress)", "Vehicle Owners Directory"]
    },
    {
      title: "Shop Floor",
      items: ["Certificates (In Progress)", "Manage Item Loss Reasons", "Manage Job Wise works", "Manage Workstations", "Scrapping History", "Scrapping Queue", "Scrapping Requests"]
    },
    {
      title: "Stores",
      items: ["Existing Stock", "Inventory Management", "Refurbishment", "Scrap & Bale Inventory", "Stock-in History (In Progress)", "Store Management"]
    },
    {
      title: "Sales",
      items: ["Manage Business Customer", "Counter Sales", "Manage Business Customer", "Manage Customers", "Sales History"]
    },
    {
      title: "Reports",
      items: ["Performance Dashboard", "Business Dashboard (In Progress)", "Dismantling Operations (In Progress)", "ELV Purchase Reports", "ELV Status Tracking", "Email Audits", "Performance Dashboard", "Scrap/ Part Sales (In Progress)", "Scrapping Reports (In Progress)", "View Logs"]
    },
    {
      title: "Master Data",
      items: ["Manage Lead Rejection Reasons", "Dynamic Storage Options", "Dynamic Storage Options", "Manage Fuel Type", "Manage Item Categories", "Manage Item Groups", "Manage Item Stocking Location", "Manage Lead Rejection", "Manage Lead Source", "Manage RTOs", "Manage Spares & Scrap Items", "Manage Vehicle Class", "Manage Vehicle Color"]
    }
  ];

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

  useEffect(() => {
    fetchDynamicOrgs();
  }, []);

  const [toast, setToast] = useState({ show: false, title: "", message: "" });

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const showToast = (title: string, message: string) => {
    setToast({ show: true, title, message });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 2600);
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
        console.log("Employees fetched:", result.data);
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
    // Initial fetch on mount
    fetchEmployees(true);
  }, []);

  useEffect(() => {
    // Debounced fetch on search/filter changes
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

  // Handlers
  const handleOpenEmployeeModal = (mode: "add" | "edit") => {
    setEditingId(mode === "edit" && selectedEmployee ? getEmpId(selectedEmployee) : null);
    const target = mode === "edit" ? selectedEmployee : null;
    const initialOrg = dynamicOrgs.length > 0 ? dynamicOrgs[0] : (organizations[0] || "");
    const initialRvsf = rvsfByOrganization[initialOrg]?.[0] || "";

    setFormData(target ? { 
      ...target,
      dob: safeFormatDate(target.dob)
    } : {
      organization: initialOrg,
      rvsf: initialRvsf,
      firstName: "", lastName: "", username: "", email: "", contact: "",
      designation: designations[0], dob: "", status: "Active",
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
    
    // Capture status change dates for records being updated
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
      // Send the activeDate string properly from the client side to guarantee UI updates
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

  // Render Helpers
  const renderHierarchyNode = (employee: Employee, grouped: Record<string, Employee[]>, depth = 0) => {
    const id = getEmpId(employee);
    const children = grouped[id] || [];
    return (
      <div key={id} className="hierarchy-item-wrap">
        <div className="node-tick" />
        <div className="hierarchy-node">
          <div className="node-avatar">👤</div>
          <div className="node-info">
            <div className="name">{employeeLabel(employee)}</div>
            <div className="role">{employee.designation}</div>
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
    <div className="employee-portal" onClick={() => setShowMegaMenu(false)}>
      {showMegaMenu && (
        <div className="mega-menu-overlay" onClick={(e) => e.stopPropagation()}>
          <div className="mega-menu-header">
            <span>Mega Menu</span>
            <button className="close-btn" onClick={() => setShowMegaMenu(false)}>×</button>
          </div>
          <div className="mega-menu-grid">
            {menuSections.map((section, idx) => (
              <div key={idx} className="menu-column">
                <div className="column-title">{section.title}</div>
                <div className="column-items">
                  {section.items.map((item, i) => (
                    <Link 
                      key={i} 
                      href={item.includes("Employees") ? "/employee" : item.includes("Organization") ? "/organization" : item.includes("RVSFs") ? "/rvsf" : "#"} 
                      className="menu-sub-item"
                      onClick={() => setShowMegaMenu(false)}
                    >
                      {item.includes("(In Progress)") ? (
                        <>
                          <span>{item.replace("(In Progress)", "")}</span>
                          <span className="in-progress">In Progress</span>
                        </>
                      ) : (
                        item
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <nav className="slim-navbar">
        <div className="nav-container">
          <div className="nav-logo">
            <img src="/nts.png" alt="NTS Logo" onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              const parent = (e.target as HTMLImageElement).parentElement;
              if (parent) {
                parent.innerHTML = '<div class="logo-placeholder">NTS</div>';
              }
            }} />
          </div>
          <div className="nav-title">ScrapCentre Pro</div>
          <div className="nav-links">
            <span className="nav-item active">Dashboard</span>
            <span className="nav-item">Reports</span>
            <span className="nav-item">Settings</span>
          </div>
          <div className="nav-profile">
            <div className="profile-mini-avatar">AD</div>
            <div className="profile-info-group">
              <span className="profile-name">Admin User</span>
              <button className="logout-button" onClick={() => {
                document.cookie = "auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                window.location.href = '/login';
              }}>Logout</button>
            </div>
          </div>
          <div className="mega-menu-trigger" onClick={(e) => { e.stopPropagation(); setShowMegaMenu(true); }}>
            ☰
          </div>
        </div>
      </nav>

      <div className="action-bar">
        <div className="nav-container">
          <div className="navigation-group">
            <button className="nav-action-btn" onClick={() => window.history.back()} title="Back">‹</button>
            <button className="nav-action-btn" onClick={() => window.history.forward()} title="Forward">›</button>
            <button className="nav-action-btn" onClick={() => window.location.href = '/'} title="Home">⌂</button>
          </div>
          <div className="breadcrumb">
             <Link href="/" className="breadcrumb-item">Home</Link>
             <span className="separator">›</span>
             <Link href="/employee" className="breadcrumb-item active current">Manage Employees</Link>
          </div>
        </div>
      </div>
      
      <div className="container">
        <section className="hero card">
          <div>
            <div className="pill">🏢 Employee Management Portal</div>
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
                  <div className="toolbar">
                    <div className="search-wrap">
                      <span className="icon">🔍</span>
                      <input placeholder="Search API..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <select value={orgFilter} onChange={(e) => setOrgFilter(e.target.value)}>
                      <option value="all">All Organizations</option>
                      {dynamicOrgs.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                </div>

                <div className="toolbar">
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
                    <div className="desc">Reporting structure live from MongoDB.</div>
                  </div>
                </div>
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
            )}

            {/* Modals and Toasts inside panel to support Fullscreen API visibility */}
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
                        {designations.map((d) => <option key={d} value={d}>{d}</option>)}
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

            {toast.show && (
              <div className="toast show" style={{ display: "block" }}>
                <strong>{toast.title}</strong>
                <div>{toast.message}</div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
