"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import SubNavbar from "../../components/SubNavbar";
import PrimaryNavbar from "../../components/PrimaryNavbar";
import "../employee/employee.css";

interface Organization {
  _id?: string;
  name: string;
  gst: string;
  contactNumber: string;
  contactPerson: string;
  email: string;
  location: string;
  state: string;
  city: string;
  pincode: string;
  createdAt?: string;
  updatedAt?: string;
}

const API_URL = "/api/organizations";

export default function OrganizationPortal() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
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

  const [formData, setFormData] = useState<Organization>({
    name: "",
    gst: "",
    contactNumber: "",
    contactPerson: "",
    email: "",
    location: "",
    state: "",
    city: "",
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

  const fetchOrganizations = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.success) {
        setOrganizations(data.data);
        if (!silent) showToast("Refreshed", "Organization records loaded.");
      } else {
        showToast("Error", data.error || "Failed to fetch organizations.");
      }
    } catch (err) {
      showToast("Error", "Network or server error.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrganizations(true);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchOrganizations(true), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Selected Organization Item
  const selectedOrg = useMemo(() => {
    return organizations.find((o) => o._id === selectedId) || null;
  }, [organizations, selectedId]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = organizations.length;
    const withGst = organizations.filter((o) => o.gst && o.gst.trim() !== "").length;
    const locations = new Set(
      organizations.map((o) => (o.city || o.location || "").trim()).filter(Boolean)
    ).size;
    return { total, withGst, locations };
  }, [organizations]);

  // Pagination calculations
  const totalEntries = organizations.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage) || 1;
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentEntries = organizations.slice(startIndex, startIndex + entriesPerPage);

  const startDisplay = totalEntries === 0 ? 0 : startIndex + 1;
  const endDisplay = Math.min(startIndex + entriesPerPage, totalEntries);

  // Form Handlers
  const handleOpenAddModal = () => {
    setFormData({
      name: "", gst: "", contactNumber: "", contactPerson: "",
      email: "", location: "", state: "", city: "", pincode: ""
    });
    setShowAddModal(true);
  };

  const handleOpenEditModal = () => {
    if (!selectedOrg) {
      showToast("Notice", "Select an organization row from the table first.");
      return;
    }
    setFormData(selectedOrg);
    setShowEditModal(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast("Validation Error", "Organization Name is required.");
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
        showToast("Success", "Organization added successfully.");
        setShowAddModal(false);
        fetchOrganizations(true);
      } else {
        showToast("Error", result.error || "Failed to add organization.");
      }
    } catch (err) {
      showToast("Error", "Network or server error.");
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrg?._id) return;
    if (!formData.name.trim()) {
      showToast("Validation Error", "Organization Name is required.");
      return;
    }
    try {
      const res = await fetch(`${API_URL}/${selectedOrg._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await res.json();
      if (result.success) {
        showToast("Success", "Organization updated.");
        setShowEditModal(false);
        fetchOrganizations(true);
      } else {
        showToast("Error", result.error || "Update failed.");
      }
    } catch (err) {
      showToast("Error", "Update failed.");
    }
  };

  const handleDelete = async () => {
    if (!selectedOrg?._id) {
      showToast("Notice", "Select an organization from the table first.");
      return;
    }
    if (!confirm(`Are you sure you want to delete '${selectedOrg.name}'?`)) return;
    try {
      const res = await fetch(`${API_URL}/${selectedOrg._id}`, { method: "DELETE" });
      const result = await res.json();
      if (result.success) {
        showToast("Success", "Organization deleted.");
        setSelectedId(null);
        setShowDrawer(false);
        fetchOrganizations(true);
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
      <SubNavbar activeTab="Manage Account" currentPage="Manage Organization" />

      <div className="container">
        {/* Hero Card */}
        <section className="hero card">
          <div>
            <h1>ScrapCentre Organization Portal</h1>
            <div className="sub">
              Manage corporate entities, GST registrations, contact points, and location details across ScrapCentre.
            </div>
          </div>
          <div className="actions">
            <button className="btn btn-primary" onClick={handleOpenAddModal}>
              ＋ Add Organization
            </button>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="stats">
          <div className="card stat">
            <div className="label">Total Organizations</div>
            <div className="value">{stats.total}</div>
            <div className="sub-label">Registered corporate entities</div>
          </div>
          <div className="card stat">
            <div className="label">Active Locations</div>
            <div className="value">{stats.locations}</div>
            <div className="sub-label">Operating operational cities</div>
          </div>
          <div className="card stat">
            <div className="label">Registered GSTs</div>
            <div className="value">{stats.withGst}</div>
            <div className="sub-label">Verified tax registrations</div>
          </div>
        </section>

        {/* Main Grid with Panel and Inspection Sidebar */}
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

            {!selectedOrg ? (
              <div className="empty-profile">
                <div className="empty-avatar"></div>
                <h3>No organization selected</h3>
                <p>Select an organization row from the table to view details.</p>
              </div>
            ) : (
              <div className="profile-content">
                <div className="profile-header">
                  <div className="profile-avatar">
                    {selectedOrg.name.slice(0, 2).toUpperCase()}
                  </div>
                  <h2 className="title">{selectedOrg.name}</h2>
                  <div className="desc">{selectedOrg.location || selectedOrg.city || "Corporate Entity"}</div>
                  <div className="profile-tags">
                    <span className="badge active">Active Entity</span>
                    <span className="badge tag">GST: {selectedOrg.gst || "N/A"}</span>
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
                    <h4>Contact Point</h4>
                    <div className="info-row">
                      <span>Contact Person</span>
                      <div style={{ fontWeight: "700" }}>{selectedOrg.contactPerson || "—"}</div>
                    </div>
                    <div className="info-row">
                      <span>Contact Number</span>
                      <div>{selectedOrg.contactNumber || "—"}</div>
                    </div>
                    <div className="info-row">
                      <span>Email ID</span>
                      <div style={{ wordBreak: "break-all" }}>{selectedOrg.email || "—"}</div>
                    </div>
                  </div>

                  <div className="profile-section">
                    <h4>Address & Location</h4>
                    <div className="info-row">
                      <span>Location</span>
                      <div>{selectedOrg.location || "—"}</div>
                    </div>
                    <div className="info-row">
                      <span>City</span>
                      <div>{selectedOrg.city || "—"}</div>
                    </div>
                    <div className="info-row">
                      <span>State</span>
                      <div>{selectedOrg.state || "—"}</div>
                    </div>
                    <div className="info-row">
                      <span>Pincode</span>
                      <div>{selectedOrg.pincode || "—"}</div>
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
                <h2 className="title">Organization Master</h2>
                <div className="desc">Select a row to edit, delete, or inspect company details.</div>
              </div>
            </div>

            {/* Toolbar Row */}
            <div className="toolbar">
              <div className="search-wrap">
                <span className="icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search by name, person or location..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn-primary" onClick={handleOpenAddModal}>
                  ＋ Add
                </button>
                <button
                  className="btn btn-outline"
                  onClick={handleOpenEditModal}
                  disabled={!selectedOrg}
                >
                  ✎ Edit
                </button>
                <button
                  className="btn btn-danger"
                  onClick={handleDelete}
                  disabled={!selectedOrg}
                >
                  🗑 Delete
                </button>
                <button
                  className={`btn btn-outline ${isRefreshing ? "loading" : ""}`}
                  onClick={() => fetchOrganizations(false)}
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
                    <th>Name</th>
                    <th>GST</th>
                    <th>Contact Nbr</th>
                    <th>Cntct Person Name</th>
                    <th>Email ID</th>
                    <th>Location Name</th>
                    <th>State</th>
                    <th>City</th>
                    <th>Pincode</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={11} style={{ textAlign: "center", padding: "40px" }}>
                        Loading organizations...
                      </td>
                    </tr>
                  ) : currentEntries.length === 0 ? (
                    <tr>
                      <td colSpan={11} style={{ textAlign: "center", padding: "40px" }}>
                        No organization entries found.
                      </td>
                    </tr>
                  ) : (
                    currentEntries.map((org, index) => {
                      const id = org._id as string;
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
                          <td style={{ fontWeight: "700" }}>{org.name}</td>
                          <td>{org.gst || "—"}</td>
                          <td>{org.contactNumber || "—"}</td>
                          <td>{org.contactPerson || "—"}</td>
                          <td>{org.email || "—"}</td>
                          <td>{org.location || "—"}</td>
                          <td>{org.state || "—"}</td>
                          <td>{org.city || "—"}</td>
                          <td>{org.pincode || "—"}</td>
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
                  {showAddModal ? "Add New Organization" : "Edit Organization"}
                </div>
                <div className="modal-sub">
                  {showAddModal
                    ? "Enter corporate entity, tax, and contact details below."
                    : "Modify organization information in database."}
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
                  <input
                    required
                    placeholder="e.g. RampUp Scrap Pvt Ltd"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>GST Number</label>
                  <input
                    placeholder="e.g. 09AAAAA0000A1Z5"
                    value={formData.gst}
                    onChange={(e) => setFormData({ ...formData, gst: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Contact Person Name</label>
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
                  <label>Email ID</label>
                  <input
                    type="email"
                    placeholder="e.g. contact@rampup.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Location Name</label>
                  <input
                    placeholder="e.g. Kanpur Industrial Hub"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>City</label>
                  <input
                    placeholder="e.g. Kanpur"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>State</label>
                  <input
                    placeholder="e.g. Uttar Pradesh"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
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
                  {showAddModal ? "Add Organization" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
