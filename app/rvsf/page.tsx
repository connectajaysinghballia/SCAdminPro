"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import SubNavbar from "../../components/SubNavbar";
import PrimaryNavbar from "../../components/PrimaryNavbar";
import "../employee/employee.css";

interface Rvsf {
  _id?: string;
  organizationName: string;
  name: string;
  contactPerson: string;
  contactNumber: string;
  email: string;
  address: string;
  locationName: string;
  pincode: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

const API_URL = "/api/rvsfs";

export default function RvsfPortal() {
  const [rvsfs, setRvsfs] = useState<Rvsf[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [toast, setToast] = useState({ show: false, title: "", msg: "" });
  const [dynamicOrgs, setDynamicOrgs] = useState<string[]>([]);

  const [formData, setFormData] = useState<Rvsf>({
    organizationName: "",
    name: "",
    contactPerson: "",
    contactNumber: "",
    email: "",
    address: "",
    locationName: "",
    pincode: "",
  });

  const showToast = (title: string, msg: string) => {
    setToast({ show: true, title, msg });
    setTimeout(() => setToast({ show: false, title: "", msg: "" }), 2800);
  };

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const fetchRvsfs = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.success) {
        setRvsfs(data.data);
        if (!silent) showToast("Refreshed", "RVSF facility records loaded.");
      } else {
        showToast("Error", data.error || "Failed to fetch RVSFs.");
      }
    } catch (err) {
      showToast("Error", "Network or server error.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

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
    fetchRvsfs(true);
    fetchDynamicOrgs();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchRvsfs(true), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Selected Item
  const selectedRvsf = useMemo(() => {
    return rvsfs.find((r) => r._id === selectedId) || null;
  }, [rvsfs, selectedId]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = rvsfs.length;
    const orgs = new Set(rvsfs.map((r) => r.organizationName).filter(Boolean)).size;
    const locations = new Set(rvsfs.map((r) => r.locationName).filter(Boolean)).size;
    return { total, orgs, locations };
  }, [rvsfs]);

  // Pagination calculation
  const totalEntries = rvsfs.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage) || 1;
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentEntries = rvsfs.slice(startIndex, startIndex + entriesPerPage);

  const startDisplay = totalEntries === 0 ? 0 : startIndex + 1;
  const endDisplay = Math.min(startIndex + entriesPerPage, totalEntries);

  // Form Handlers
  const handleOpenAddModal = () => {
    const defaultOrg = dynamicOrgs.length > 0 ? dynamicOrgs[0] : "";
    setFormData({
      organizationName: defaultOrg, name: "", contactPerson: "",
      contactNumber: "", email: "", address: "", locationName: "", pincode: ""
    });
    setShowAddModal(true);
  };

  const handleOpenEditModal = () => {
    if (!selectedRvsf) {
      showToast("Notice", "Select an RVSF facility from the table first.");
      return;
    }
    setFormData(selectedRvsf);
    setShowEditModal(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.organizationName.trim()) {
      showToast("Validation Error", "Organization and RVSF Name are required.");
      return;
    }
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await res.json();
      if (result.success) {
        showToast("Success", "RVSF registered successfully.");
        setShowAddModal(false);
        fetchRvsfs(true);
      } else {
        showToast("Error", result.error || "Failed to add RVSF.");
      }
    } catch (err) {
      showToast("Error", "Network or server error.");
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRvsf?._id) return;
    try {
      const res = await fetch(`${API_URL}/${selectedRvsf._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await res.json();
      if (result.success) {
        showToast("Success", "RVSF details updated.");
        setShowEditModal(false);
        fetchRvsfs(true);
      } else {
        showToast("Error", result.error || "Update failed.");
      }
    } catch (err) {
      showToast("Error", "Update failed.");
    }
  };

  const handleDelete = async () => {
    if (!selectedRvsf?._id) {
      showToast("Notice", "Select an RVSF facility from the table first.");
      return;
    }
    if (!confirm(`Are you sure you want to delete '${selectedRvsf.name}'?`)) return;
    try {
      const res = await fetch(`${API_URL}/${selectedRvsf._id}`, { method: "DELETE" });
      const result = await res.json();
      if (result.success) {
        showToast("Success", "RVSF facility deleted.");
        setSelectedId(null);
        setShowDrawer(false);
        fetchRvsfs(true);
      } else {
        showToast("Error", result.error || "Delete failed.");
      }
    } catch (err) {
      showToast("Error", "Delete failed.");
    }
  };

  return (
    <div className="employee-portal">
      {/* Centralized Primary Navbar */}
      <PrimaryNavbar />

      {/* Shared SubNavbar */}
      <SubNavbar activeTab="Manage Account" currentPage="Manage RVSFs" />

      <div className="container">
        {/* Hero Card */}
        <section className="hero card">
          <div>
            <h1>ScrapCentre RVSF Portal</h1>
            <div className="sub">
              Manage and track Registered Vehicle Scrapping Facilities (RVSF) across network organizations.
            </div>
          </div>
          <div className="actions">
            <button className="btn btn-primary" onClick={handleOpenAddModal}>
              ＋ Add RVSF
            </button>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="stats">
          <div className="card stat">
            <div className="label">Total RVSFs</div>
            <div className="value">{stats.total}</div>
            <div className="sub-label">Registered scrapping facilities</div>
          </div>
          <div className="card stat">
            <div className="label">Mapped Entities</div>
            <div className="value">{stats.orgs}</div>
            <div className="sub-label">Corporate organizations</div>
          </div>
          <div className="card stat">
            <div className="label">Facility Locations</div>
            <div className="value">{stats.locations}</div>
            <div className="sub-label">Active facility hubs</div>
          </div>
        </section>

        {/* Grid Section */}
        <section ref={panelRef} className={`grid ${selectedId ? "has-sidebar" : ""}`}>
          {/* Profile Sidebar Drawer for Selected Item */}
          <aside className={`profile-sidebar ${showDrawer ? "open" : ""}`}>
            <button
              className="drawer-close-btn"
              onClick={() => {
                setShowDrawer(false);
                setSelectedId(null);
              }}
            >
              ✕ Close
            </button>

            {!selectedRvsf ? (
              <div className="empty-profile">
                <div className="empty-avatar"></div>
                <h3>No RVSF selected</h3>
                <p>Select an RVSF facility row from the table to view details.</p>
              </div>
            ) : (
              <div className="profile-content">
                <div className="profile-header">
                  <div className="profile-avatar">
                    {selectedRvsf.name.slice(0, 2).toUpperCase()}
                  </div>
                  <h2 className="title">{selectedRvsf.name}</h2>
                  <div className="desc">{selectedRvsf.organizationName}</div>
                  <div className="profile-tags">
                    <span className="badge active">Registered RVSF</span>
                    <span className="badge tag">Location: {selectedRvsf.locationName || "N/A"}</span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px", margin: "16px 0 20px" }}>
                  <button className="btn btn-outline" style={{ flex: 1 }} onClick={handleOpenEditModal}>
                    ✎ Edit Details
                  </button>
                  <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleDelete}>
                    🗑 Delete
                  </button>
                </div>

                <div className="profile-sections">
                  <div className="profile-section">
                    <h4>Contact Person</h4>
                    <div className="info-row">
                      <span>Name</span>
                      <div style={{ fontWeight: "700" }}>{selectedRvsf.contactPerson || "—"}</div>
                    </div>
                    <div className="info-row">
                      <span>Contact Number</span>
                      <div>{selectedRvsf.contactNumber || "—"}</div>
                    </div>
                    <div className="info-row">
                      <span>Email ID</span>
                      <div style={{ wordBreak: "break-all" }}>{selectedRvsf.email || "—"}</div>
                    </div>
                  </div>

                  <div className="profile-section">
                    <h4>Facility Address</h4>
                    <div className="info-row">
                      <span>Address</span>
                      <div>{selectedRvsf.address || "—"}</div>
                    </div>
                    <div className="info-row">
                      <span>Location</span>
                      <div>{selectedRvsf.locationName || "—"}</div>
                    </div>
                    <div className="info-row">
                      <span>Pincode</span>
                      <div>{selectedRvsf.pincode || "—"}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </aside>

          {/* Main Table Panel */}
          <div className={`card panel ${isFullscreen ? "fullscreen-table" : ""}`}>
            <div className="panel-header">
              <div>
                <h2 className="title">RVSF Master Records</h2>
                <div className="desc">Select a row to edit, delete, or inspect facility details.</div>
              </div>
            </div>

            {/* Toolbar */}
            <div className="toolbar">
              <div className="search-wrap">
                <span className="icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search RVSF, contact or location..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              <div className="entries-select-wrap">
                <label htmlFor="rvsf-entries-select">Show</label>
                <select
                  id="rvsf-entries-select"
                  value={entriesPerPage}
                  onChange={(e) => {
                    setEntriesPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span>records per page</span>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn-primary" onClick={handleOpenAddModal}>
                  ＋ Add
                </button>
                <button
                  className="btn btn-outline"
                  onClick={handleOpenEditModal}
                  disabled={!selectedRvsf}
                >
                  ✎ Edit
                </button>
                <button
                  className="btn btn-danger"
                  onClick={handleDelete}
                  disabled={!selectedRvsf}
                >
                  🗑 Delete
                </button>
                <button
                  className={`btn btn-outline ${isRefreshing ? "loading" : ""}`}
                  onClick={() => fetchRvsfs(false)}
                  disabled={isRefreshing}
                >
                  {isRefreshing ? "⏳ Refreshing..." : "↻ Refresh"}
                </button>
              </div>

              <button
                className="btn btn-outline"
                style={{ marginLeft: "auto", fontWeight: "900", fontSize: "18px" }}
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

            {/* Table Wrap */}
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: "40px" }}></th>
                    <th style={{ width: "70px" }}>S No.</th>
                    <th>Organization Name</th>
                    <th>RVSF Name</th>
                    <th>Contact Person</th>
                    <th>Contact Nbr</th>
                    <th>Email</th>
                    <th>Address</th>
                    <th>Location Name</th>
                    <th>Pincode</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={10} style={{ textAlign: "center", padding: "40px" }}>
                        Loading RVSF records...
                      </td>
                    </tr>
                  ) : currentEntries.length === 0 ? (
                    <tr>
                      <td colSpan={10} style={{ textAlign: "center", padding: "40px" }}>
                        No RVSF facility records found.
                      </td>
                    </tr>
                  ) : (
                    currentEntries.map((rvsf, index) => {
                      const id = rvsf._id as string;
                      const sNo = startIndex + index + 1;
                      const isSelected = selectedId === id;
                      return (
                        <tr
                          key={id}
                          className={isSelected ? "selected" : ""}
                          onClick={() => {
                            if (selectedId === id) {
                              setSelectedId(null);
                              setShowDrawer(false);
                            } else {
                              setSelectedId(id);
                              setShowDrawer(true);
                            }
                          }}
                        >
                          <td>
                            <span className="radio"></span>
                          </td>
                          <td>{sNo}</td>
                          <td style={{ fontWeight: "500" }}>{rvsf.organizationName}</td>
                          <td style={{ fontWeight: "700" }}>{rvsf.name}</td>
                          <td>{rvsf.contactPerson || "—"}</td>
                          <td>{rvsf.contactNumber || "—"}</td>
                          <td>{rvsf.email || "—"}</td>
                          <td>
                            <div style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {rvsf.address || "—"}
                            </div>
                          </td>
                          <td>{rvsf.locationName || "—"}</td>
                          <td>{rvsf.pincode || "—"}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Wrap */}
            <div className="pagination-wrap">
              <div style={{ fontSize: 13, color: "#64748b" }}>
                Showing {startDisplay} to {endDisplay} of {totalEntries} entries
              </div>

              <div className="pagination-buttons">
                <button
                  className="page-btn"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    className={`page-btn ${currentPage === pageNum ? "active" : ""}`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  className="page-btn"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages || totalPages === 0}
                >
                  Next
                </button>
              </div>
            </div>

            {/* Toast Notification */}
            {toast.show && (
              <div className="toast show">
                <strong>{toast.title}</strong>
                <div>{toast.msg}</div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Add/Edit Modal - Root Viewport Centered with Pure Background Blur */}
      {(showAddModal || showEditModal) && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddModal(false);
              setShowEditModal(false);
            }
          }}
        >
          <div className="modal">
            <div className="modal-header">
              <div>
                <div className="modal-title">
                  {showAddModal ? "Register New RVSF" : "Edit RVSF Facility"}
                </div>
                <div className="modal-sub">
                  {showAddModal
                    ? "Fill in scrapping facility registration details below."
                    : "Modify RVSF facility information in database."}
                </div>
              </div>
              <button
                className="close"
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={showAddModal ? handleAddSubmit : handleEditSubmit}>
              <div className="form-grid">
                <div className="field">
                  <label>
                    Organization Name <span className="req">*</span>
                  </label>
                  <select
                    required
                    value={formData.organizationName}
                    onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                  >
                    {dynamicOrgs.length > 0 ? (
                      dynamicOrgs.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))
                    ) : (
                      <option value="">No organizations available</option>
                    )}
                  </select>
                </div>
                <div className="field">
                  <label>
                    RVSF Facility Name <span className="req">*</span>
                  </label>
                  <input
                    required
                    placeholder="e.g. Kanpur RVSF Facility 1"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Contact Person</label>
                  <input
                    placeholder="e.g. Shubham Shukla"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Contact Number</label>
                  <input
                    placeholder="e.g. 9876543210"
                    value={formData.contactNumber}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. rvsf.kanpur@rampup.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Facility Address</label>
                  <input
                    placeholder="e.g. Plot 45, Industrial Scrapping Zone"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Location Name</label>
                  <input
                    placeholder="e.g. Kanpur North"
                    value={formData.locationName}
                    onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Pincode</label>
                  <input
                    placeholder="e.g. 208001"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {showAddModal ? "Register RVSF" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
