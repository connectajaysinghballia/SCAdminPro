"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import PrimaryNavbar from "../../components/PrimaryNavbar";
import SubNavbar from "../../components/SubNavbar";
import "./designation.css";

interface DesignationItem {
  _id?: string;
  designationCd: string;
  designationName: string;
  createdBy?: string;
  createdOn?: string;
  createdAt?: string;
  updatedAt?: string;
}

const PREDEFINED_DESIGNATIONS = [
  { cd: "LM", name: "Logistics Manager" },
  { cd: "HR", name: "Human Resource" },
  { cd: "FSM", name: "Finance Senior Assistant Manager" },
  { cd: "SAP", name: "System Admin Procurement" },
  { cd: "BA", name: "Business Admin" },
  { cd: "SA", name: "System Admin" },
  { cd: "RM", name: "Refurbishment Manager" },
  { cd: "RE", name: "Refurbishment Executive" },
  { cd: "SE", name: "Sales Executive" },
  { cd: "SAM", name: "Sales Manager" },
  { cd: "BM", name: "Branch Manager" },
  { cd: "OM", name: "Operations Manager" },
  { cd: "FM", name: "Facility Manager" },
  { cd: "QC", name: "Quality Checker" },
  { cd: "INV", name: "Inventory Supervisor" },
  { cd: "DM", name: "Dismantling Engineer" },
  { cd: "ACC", name: "Senior Accountant" },
  { cd: "SEC", name: "Security Officer" },
  { cd: "TECH", name: "IT Support Specialist" },
  { cd: "SUP", name: "Site Supervisor" }
];

const API_URL = "/api/designations";

export default function DesignationPortal() {
  const [designations, setDesignations] = useState<DesignationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const [entriesPerPage, setEntriesPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showDrawer, setShowDrawer] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Modal State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{ designationCd: string; designationName: string; createdBy: string }>({
    designationCd: "",
    designationName: "",
    createdBy: ""
  });

  // Combined options for editable dropdown datalist
  const allDropdownOptions = useMemo(() => {
    const listMap = new Map<string, { cd: string; name: string }>();

    PREDEFINED_DESIGNATIONS.forEach((item) => {
      listMap.set(item.cd.toUpperCase(), item);
    });

    designations.forEach((item) => {
      if (item.designationCd && !listMap.has(item.designationCd.toUpperCase())) {
        listMap.set(item.designationCd.toUpperCase(), {
          cd: item.designationCd,
          name: item.designationName
        });
      }
    });

    return Array.from(listMap.values());
  }, [designations]);

  // Toast notification state
  const [toast, setToast] = useState<{ show: boolean; title: string; message: string }>({
    show: false,
    title: "",
    message: ""
  });

  const showToast = (title: string, message: string) => {
    setToast({ show: true, title, message });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 2800);
  };

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const fetchDesignations = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}?search=${encodeURIComponent(search)}`);
      const result = await res.json();
      if (result.success) {
        setDesignations(result.data);
        if (!silent) showToast("Refreshed", "Designation records fetched from database.");
      } else {
        showToast("Error", result.error || "Failed to load designations.");
      }
    } catch (err) {
      console.error("Fetch designations error:", err);
      showToast("Error", "Network or server connection error.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDesignations(true);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchDesignations(true), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Selected Item
  const selectedDesignation = useMemo(() => {
    return designations.find((d) => d._id === selectedId) || null;
  }, [designations, selectedId]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = designations.length;
    const withAuthor = designations.filter((d) => d.createdBy && d.createdBy.trim() !== "").length;
    const systemRoles = designations.filter((d) => !d.createdBy || d.createdBy.trim() === "").length;
    return { total, withAuthor, systemRoles };
  }, [designations]);

  // Pagination calculation
  const totalEntries = designations.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage) || 1;
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentEntries = designations.slice(startIndex, startIndex + entriesPerPage);

  const startDisplay = totalEntries === 0 ? 0 : startIndex + 1;
  const endDisplay = Math.min(startIndex + entriesPerPage, totalEntries);

  // Modal Handlers
  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({ designationCd: "", designationName: "", createdBy: "" });
    setShowModal(true);
  };

  const handleOpenEditModal = () => {
    if (!selectedDesignation) {
      showToast("Notice", "Select a designation from the table first.");
      return;
    }
    setEditingId(selectedDesignation._id || null);
    setFormData({
      designationCd: selectedDesignation.designationCd,
      designationName: selectedDesignation.designationName,
      createdBy: selectedDesignation.createdBy || ""
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!selectedDesignation || !selectedDesignation._id) {
      showToast("Notice", "Select a designation from the table first.");
      return;
    }

    if (!confirm(`Are you sure you want to delete '${selectedDesignation.designationName}'?`)) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/${selectedDesignation._id}`, {
        method: "DELETE"
      });
      const result = await res.json();
      if (result.success) {
        showToast("Success", "Designation deleted from database.");
        setSelectedId(null);
        setShowDrawer(false);
        fetchDesignations(true);
      } else {
        showToast("Error", result.error || "Failed to delete designation.");
      }
    } catch (err) {
      showToast("Error", "Network or server error.");
    }
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.designationCd.trim() || !formData.designationName.trim()) {
      showToast("Validation Error", "Designation Code and Title are required.");
      return;
    }

    try {
      let res;
      if (editingId) {
        res = await fetch(`${API_URL}/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            designationCd: formData.designationCd,
            designationName: formData.designationName
          })
        });
      } else {
        res = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            designationCd: formData.designationCd,
            designationName: formData.designationName,
            createdBy: formData.createdBy
          })
        });
      }

      const result = await res.json();
      if (result.success) {
        showToast(
          "Success",
          editingId ? "Designation updated in database." : "Designation saved to database ('User Designation')."
        );
        setShowModal(false);
        setFormData({ designationCd: "", designationName: "", createdBy: "" });
        fetchDesignations(true);
      } else {
        showToast("Error", result.error || "Failed to save designation.");
      }
    } catch (err) {
      showToast("Error", "Network or server error.");
    }
  };

  return (
    <div className="employee-portal designation-portal">
      {/* Centralized Primary Navbar & SubNavbar */}
      <PrimaryNavbar />
      <SubNavbar activeTab="Manage Account" currentPage="User Designations" />

      <div className="container">
        {/* Hero Card Section */}
        <section className="hero card">
          <div>
            <h1>ScrapCentre Designation Portal</h1>
            <div className="sub">
              Manage user designation titles, codes, and master database records across ScrapCentre.
            </div>
          </div>
          <div className="actions">
            <button className="btn btn-primary" onClick={handleOpenAddModal}>
              ＋ Add Designation
            </button>
          </div>
        </section>

        {/* Stats Grid Section */}
        <section className="stats">
          <div className="card stat">
            <div className="label">Total Designations</div>
            <div className="value">{stats.total}</div>
            <div className="sub-label">Master designation records</div>
          </div>
          <div className="card stat">
            <div className="label">Assigned Roles</div>
            <div className="value">{stats.withAuthor}</div>
            <div className="sub-label">Created by system admins</div>
          </div>
          <div className="card stat">
            <div className="label">System Default</div>
            <div className="value">{stats.systemRoles}</div>
            <div className="sub-label">Standard operational titles</div>
          </div>
        </section>

        {/* Grid Section with Table Panel and Profile Sidebar */}
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

            {!selectedDesignation ? (
              <div className="empty-profile">
                <div className="empty-avatar"></div>
                <h3>No designation selected</h3>
                <p>Select a designation row from the table to view details.</p>
              </div>
            ) : (
              <div className="profile-content">
                <div className="profile-header">
                  <div className="profile-avatar">
                    {selectedDesignation.designationCd.slice(0, 2).toUpperCase()}
                  </div>
                  <h2 className="title">{selectedDesignation.designationName}</h2>
                  <div className="desc">Code: {selectedDesignation.designationCd}</div>
                  <div className="profile-tags">
                    <span className="badge active">Database Active</span>
                    <span className="badge code-tag">{selectedDesignation.designationCd}</span>
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
                    <h4>Designation Overview</h4>
                    <div className="info-row">
                      <span>Designation CD</span>
                      <div style={{ fontWeight: "700" }}>{selectedDesignation.designationCd}</div>
                    </div>
                    <div className="info-row">
                      <span>Full Title</span>
                      <div>{selectedDesignation.designationName}</div>
                    </div>
                  </div>

                  <div className="profile-section">
                    <h4>Audit Trail</h4>
                    <div className="info-row">
                      <span>Created By</span>
                      <div>{selectedDesignation.createdBy || "—"}</div>
                    </div>
                    <div className="info-row">
                      <span>Created On</span>
                      <div>{selectedDesignation.createdOn || "—"}</div>
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
                <h2 className="title">Designation Master Records</h2>
                <div className="desc">Select a row to edit, delete, or inspect database details.</div>
              </div>
            </div>

            {/* Toolbar */}
            <div className="toolbar">
              <div className="search-wrap">
                <span className="icon">🔍</span>
                <input
                  placeholder="Search designation code or title..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              <div className="entries-select-wrap">
                <label htmlFor="entries-select">Show</label>
                <select
                  id="entries-select"
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
                  disabled={!selectedDesignation}
                >
                  ✎ Edit
                </button>
                <button
                  className="btn btn-danger"
                  onClick={handleDelete}
                  disabled={!selectedDesignation}
                >
                  🗑 Delete
                </button>
                <button
                  className={`btn btn-outline ${isRefreshing ? "loading" : ""}`}
                  onClick={() => fetchDesignations(false)}
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
                    <th>Designation Cd</th>
                    <th>Designation</th>
                    <th>Created by</th>
                    <th>Created on</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: "40px" }}>
                        Loading designations...
                      </td>
                    </tr>
                  ) : currentEntries.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: "40px" }}>
                        No designation entries found.
                      </td>
                    </tr>
                  ) : (
                    currentEntries.map((item, index) => {
                      const id = item._id as string;
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
                          <td>
                            <span className="badge code-tag">{item.designationCd}</span>
                          </td>
                          <td>
                            <strong>{item.designationName}</strong>
                          </td>
                          <td>{item.createdBy || ""}</td>
                          <td>{item.createdOn || ""}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination & Summary Footer */}
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
                <div>{toast.message}</div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Modal Dialog rendered at root of portal for 100% dead-center window viewport alignment */}
      {showModal && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className="modal modal-sm">
            <div className="modal-header">
              <div>
                <div className="modal-title">
                  {editingId ? "Edit Designation" : "Add Designation"}
                </div>
                <div className="modal-sub">
                  {editingId
                    ? "Modify designation code and title details in database."
                    : "Create a new designation in database ('User Designation')."}
                </div>
              </div>
              <button className="close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>

            <form onSubmit={handleSaveModal}>
              <div className="form-grid" style={{ gridTemplateColumns: "1fr" }}>
                {/* Designation CD Input */}
                <div className="field">
                  <label htmlFor="modal-cd">
                    Designation cd <span className="req">*</span>
                  </label>
                  <input
                    id="modal-cd"
                    required
                    autoFocus
                    placeholder="e.g. HR, FSM, LM"
                    value={formData.designationCd}
                    onChange={(e) =>
                      setFormData({ ...formData, designationCd: e.target.value })
                    }
                  />
                </div>

                {/* Designation Title Input */}
                <div className="field">
                  <label htmlFor="modal-name">
                    Designation <span className="req">*</span>
                  </label>
                  <input
                    id="modal-name"
                    required
                    placeholder="e.g. Human Resource, Logistics Manager"
                    value={formData.designationName}
                    onChange={(e) =>
                      setFormData({ ...formData, designationName: e.target.value })
                    }
                  />
                </div>

                <div className="field">
                  <label htmlFor="modal-author">Created by</label>
                  <input
                    id="modal-author"
                    placeholder="Optional author name"
                    value={formData.createdBy}
                    onChange={(e) =>
                      setFormData({ ...formData, createdBy: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  {editingId ? "Update Designation" : "Save Designation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
