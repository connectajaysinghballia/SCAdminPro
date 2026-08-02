"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import PrimaryNavbar from "@/components/PrimaryNavbar";
import SubNavbar from "@/components/SubNavbar";
import "./elv-leads.css";

interface ElvLead {
  _id?: string;
  leadId: number;
  leadType: string;
  supplierName: string;
  facilitatorName?: string;
  contact: string;
  additionalDetails: string;
  elvLocation: string;
  registeredBy: string;
  registrationDate: string | Date;
  estimatedSaleValue: number;
  totalPurchaseValue: number;
  status: "Ongoing" | "Under Approval" | "Approved" | "Rejected";

  // Individual fields
  ownerName?: string;
  mobileNumber?: string;
  emailId?: string;
  vehicleCurrentLocation?: string;
  vehicleRegistrationNumber?: string;
  vehicleType?: string;
  vehicleName?: string;
  modelYear?: string;
  vehicleClass?: string;
  vehicleCategory?: string;
  fuelType?: string;
  vehicleUsageType?: string;
  mobilityCondition?: string;
  engineWorkingCondition?: string;
  battery?: string;
  stepney?: string;
  tyres?: string;
  alloys?: string;
  steelRims?: string;

  // Purchase details
  leadValue?: number;
  additionalFee?: number;
  freightCharges?: number;
  otherCharges?: number;
}

const API_URL = "/api/elv-leads";

export default function ElvLeadsPage() {
  const [leads, setLeads] = useState<ElvLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState<
    "Ongoing" | "Under Approval" | "Approved" | "Rejected"
  >("Ongoing");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState<ElvLead | null>(null);
  const [toast, setToast] = useState({ show: false, title: "", msg: "" });

  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Form State
  const initialFormState = {
    leadType: "Other",
    supplierName: "",
    facilitatorName: "",

    ownerName: "",
    mobileNumber: "",
    emailId: "",
    vehicleCurrentLocation: "",

    vehicleRegistrationNumber: "",
    vehicleType: "",
    vehicleName: "",
    modelYear: "",
    vehicleClass: "",
    vehicleCategory: "",
    fuelType: "",
    vehicleUsageType: "",

    mobilityCondition: "",
    engineWorkingCondition: "",
    battery: "",
    stepney: "",
    tyres: "",
    alloys: "",
    steelRims: "",

    leadValue: "",
    additionalFee: "",
    freightCharges: "",
    otherCharges: "",

    elvLocation: "KANPUR NAGAR",
  };

  const [formData, setFormData] = useState(initialFormState);

  const showToast = (title: string, msg: string) => {
    setToast({ show: true, title, msg });
    setTimeout(() => setToast({ show: false, title: "", msg: "" }), 3000);
  };

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const fetchLeads = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      setLoading(true);
      const res = await fetch(
        `${API_URL}?status=${encodeURIComponent(
          statusTab
        )}&search=${encodeURIComponent(search)}`
      );
      const result = await res.json();
      if (result.success) {
        setLeads(result.data);
        if (!silent) showToast("Refreshed", "ELV Leads updated from database.");
      } else {
        showToast("Error", result.error || "Failed to fetch leads.");
      }
    } catch (err) {
      showToast("Error", "Network or server error.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeads(true);
  }, [statusTab]);

  useEffect(() => {
    const t = setTimeout(() => fetchLeads(true), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Selected Lead Item
  const selectedLead = useMemo(() => {
    return leads.find((l) => l._id === selectedId) || null;
  }, [leads, selectedId]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = leads.length;
    const totalValue = leads.reduce(
      (sum, l) => sum + (Number(l.totalPurchaseValue) || 0),
      0
    );
    const locations = new Set(leads.map((l) => l.elvLocation).filter(Boolean)).size;
    return { total, totalValue, locations };
  }, [leads]);

  // Pagination calculation
  const totalEntries = leads.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage) || 1;
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentEntries = leads.slice(startIndex, startIndex + entriesPerPage);

  const startDisplay = totalEntries === 0 ? 0 : startIndex + 1;
  const endDisplay = Math.min(startIndex + entriesPerPage, totalEntries);

  // Calculated Purchase Total
  const calculatedTotalPurchase = useMemo(() => {
    const leadVal = parseFloat(formData.leadValue) || 0;
    const addFee = parseFloat(formData.additionalFee) || 0;
    const freight = parseFloat(formData.freightCharges) || 0;
    const other = parseFloat(formData.otherCharges) || 0;
    return leadVal + addFee + freight + other;
  }, [
    formData.leadValue,
    formData.additionalFee,
    formData.freightCharges,
    formData.otherCharges,
  ]);

  // Form Handlers
  const handleOpenAddModal = () => {
    setEditingLead(null);
    setFormData(initialFormState);
    setShowModal(true);
  };

  const handleOpenEditModal = (lead?: any) => {
    const targetLead = lead || selectedLead;
    if (!targetLead) {
      showToast("Notice", "Select an ELV lead row from the table first.");
      return;
    }
    setEditingLead(targetLead);
    setFormData({
      leadType: targetLead.leadType || "Individual",
      supplierName: targetLead.supplierName || "",
      facilitatorName: targetLead.facilitatorName || "",

      ownerName: targetLead.ownerName || targetLead.supplierName || "",
      mobileNumber: targetLead.mobileNumber || targetLead.contact || "",
      emailId: targetLead.emailId || "",
      vehicleCurrentLocation: targetLead.vehicleCurrentLocation || "",

      vehicleRegistrationNumber: targetLead.vehicleRegistrationNumber || "",
      vehicleType: targetLead.vehicleType || "",
      vehicleName: targetLead.vehicleName || "",
      modelYear: targetLead.modelYear || "",
      vehicleClass: targetLead.vehicleClass || "",
      vehicleCategory: targetLead.vehicleCategory || "",
      fuelType: targetLead.fuelType || "",
      vehicleUsageType: targetLead.vehicleUsageType || "",

      mobilityCondition: targetLead.mobilityCondition || "",
      engineWorkingCondition: targetLead.engineWorkingCondition || "",
      battery: targetLead.battery || "",
      stepney: targetLead.stepney || "",
      tyres: targetLead.tyres || "",
      alloys: targetLead.alloys || "",
      steelRims: targetLead.steelRims || "",

      leadValue: targetLead.leadValue ? String(targetLead.leadValue) : "",
      additionalFee: targetLead.additionalFee
        ? String(targetLead.additionalFee)
        : "",
      freightCharges: targetLead.freightCharges
        ? String(targetLead.freightCharges)
        : "",
      otherCharges: targetLead.otherCharges
        ? String(targetLead.otherCharges)
        : "",

      elvLocation: targetLead.elvLocation || "KANPUR NAGAR",
    });
    setShowModal(true);
  };

  const handleDelete = async (id?: string, leadId?: number) => {
    const targetId = id || selectedLead?._id;
    const targetLeadId = leadId || selectedLead?.leadId;
    if (!targetId) {
      showToast("Notice", "Select an ELV lead row from the table first.");
      return;
    }
    if (!confirm(`Are you sure you want to delete Lead #${targetLeadId}?`))
      return;
    try {
      const res = await fetch(`${API_URL}/${targetId}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (result.success) {
        showToast("Success", `Lead #${targetLeadId} deleted.`);
        if (selectedId === targetId) {
          setSelectedId(null);
          setShowDrawer(false);
        }
        fetchLeads(true);
      } else {
        showToast("Error", result.error || "Delete failed.");
      }
    } catch (err) {
      showToast("Error", "Delete failed.");
    }
  };

  const handleSubmitStatus = async (id?: string, leadId?: number) => {
    const targetId = id || selectedLead?._id;
    const targetLeadId = leadId || selectedLead?.leadId;
    if (!targetId) return;
    try {
      const res = await fetch(`${API_URL}/${targetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Under Approval" }),
      });
      const result = await res.json();
      if (result.success) {
        showToast("Submitted", `Lead #${targetLeadId} sent for approval.`);
        fetchLeads(true);
      } else {
        showToast("Error", result.error || "Submission failed.");
      }
    } catch (err) {
      showToast("Error", "Submission failed.");
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.leadType) {
      showToast("Validation Error", "Lead Source Type is required.");
      return;
    }

    const payload: any = {
      leadType: formData.leadType,
      supplierName:
        formData.supplierName || formData.ownerName || "Default Supplier",
      facilitatorName: formData.facilitatorName,
      elvLocation: formData.elvLocation || "KANPUR NAGAR",
      leadValue: parseFloat(formData.leadValue) || 0,
      additionalFee: parseFloat(formData.additionalFee) || 0,
      freightCharges: parseFloat(formData.freightCharges) || 0,
      otherCharges: parseFloat(formData.otherCharges) || 0,
    };

    if (formData.leadType === "Individual") {
      payload.ownerName = formData.ownerName;
      payload.mobileNumber = formData.mobileNumber;
      payload.emailId = formData.emailId;
      payload.vehicleCurrentLocation = formData.vehicleCurrentLocation;

      payload.vehicleRegistrationNumber = formData.vehicleRegistrationNumber;
      payload.vehicleType = formData.vehicleType;
      payload.vehicleName = formData.vehicleName;
      payload.modelYear = formData.modelYear;
      payload.vehicleClass = formData.vehicleClass;
      payload.vehicleCategory = formData.vehicleCategory;
      payload.fuelType = formData.fuelType;
      payload.vehicleUsageType = formData.vehicleUsageType;

      payload.mobilityCondition = formData.mobilityCondition;
      payload.engineWorkingCondition = formData.engineWorkingCondition;
      payload.battery = formData.battery;
      payload.stepney = formData.stepney;
      payload.tyres = formData.tyres;
      payload.alloys = formData.alloys;
      payload.steelRims = formData.steelRims;

      payload.contact = formData.mobileNumber;
      payload.supplierName =
        formData.ownerName || formData.supplierName || "Individual Supplier";
      payload.additionalDetails = `Vehicle Number: ${
        formData.vehicleRegistrationNumber || "N/A"
      }, Vehicle Category: ${
        formData.vehicleCategory || "N/A"
      }, Model Year: ${formData.modelYear || "N/A"}`;
    }

    try {
      let res;
      if (editingLead?._id) {
        res = await fetch(`${API_URL}/${editingLead._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const result = await res.json();
      if (result.success) {
        showToast(
          "Success",
          editingLead ? "ELV Lead updated." : "New ELV Lead registered."
        );
        setShowModal(false);
        fetchLeads(true);
      } else {
        showToast("Error", result.error || "Save failed.");
      }
    } catch (err) {
      showToast("Error", "Server error saving lead.");
    }
  };

  return (
    <div className="employee-portal">
      {/* Centralized Primary Navbar */}
      <PrimaryNavbar />

      {/* Shared SubNavbar */}
      <SubNavbar activeTab="Purchases" currentPage="Manage ELV Leads" />

      <div className="container">
        {/* Hero Card */}
        <section className="hero card">
          <div>
            <h1>ScrapCentre ELV Leads Portal</h1>
            <div className="sub">
              Manage and track End-of-Life Vehicle (ELV) purchase leads, digital inspections, and approvals across facility hubs.
            </div>
          </div>
          <div className="actions">
            <button className="btn btn-primary" onClick={handleOpenAddModal}>
              Register New Lead
            </button>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="stats">
          <div className="card stat">
            <div className="label">Total Leads ({statusTab})</div>
            <div className="value">{stats.total}</div>
            <div className="sub-label">Filtered lead records</div>
          </div>
          <div className="card stat">
            <div className="label">Total Purchase Value</div>
            <div className="value">
              ₹ {(stats.totalValue / 1000).toFixed(1)}k
            </div>
            <div className="sub-label">Combined procurement value</div>
          </div>
          <div className="card stat">
            <div className="label">Facility Locations</div>
            <div className="value">{stats.locations}</div>
            <div className="sub-label">Active facility hubs</div>
          </div>
        </section>

        {/* Grid Layout Section */}
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

            {!selectedLead ? (
              <div className="empty-profile">
                <div className="empty-avatar"></div>
                <h3>No Lead Selected</h3>
                <p>Select an ELV lead row from the table to view full details.</p>
              </div>
            ) : (
              <div className="profile-content">
                <div className="profile-header">
                  <div className="profile-avatar">
                    #{selectedLead.leadId}
                  </div>
                  <h2 className="title">{selectedLead.supplierName}</h2>
                  <div className="desc">{selectedLead.leadType} Lead</div>
                  <div className="profile-tags">
                    <span className="badge active">{selectedLead.status}</span>
                    <span className="badge tag">
                      Location: {selectedLead.elvLocation || "N/A"}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px", margin: "16px 0 20px" }}>
                  <button
                    className="btn btn-outline"
                    style={{ flex: 1 }}
                    onClick={() => handleOpenEditModal()}
                  >
                    ✎ Edit Details
                  </button>
                  <button
                    className="btn btn-danger"
                    style={{ flex: 1 }}
                    onClick={() => handleDelete()}
                  >
                    🗑 Delete
                  </button>
                </div>

                {selectedLead.status === "Ongoing" && (
                  <button
                    className="btn btn-primary"
                    style={{ width: "100%", marginBottom: "20px", justifyContent: "center" }}
                    onClick={() => handleSubmitStatus()}
                  >
                    Submit for Approval
                  </button>
                )}

                <div className="profile-sections">
                  <div className="profile-section">
                    <h4>Lead Details</h4>
                    <div className="info-row">
                      <span>Supplier Name</span>
                      <div style={{ fontWeight: "700" }}>{selectedLead.supplierName}</div>
                    </div>
                    <div className="info-row">
                      <span>Contact</span>
                      <div>{selectedLead.contact || "—"}</div>
                    </div>
                    <div className="info-row">
                      <span>Registered By</span>
                      <div>{selectedLead.registeredBy || "—"}</div>
                    </div>
                    <div className="info-row">
                      <span>Registration Date</span>
                      <div>
                        {new Date(selectedLead.registrationDate)
                          .toISOString()
                          .replace("T", " ")
                          .slice(0, 19)}
                      </div>
                    </div>
                  </div>

                  <div className="profile-section">
                    <h4>Vehicle Information</h4>
                    <div className="info-row">
                      <span>Details</span>
                      <div style={{ fontSize: "12px", textAlign: "right" }}>
                        {selectedLead.additionalDetails || "—"}
                      </div>
                    </div>
                    <div className="info-row">
                      <span>Owner Name</span>
                      <div>{selectedLead.ownerName || "—"}</div>
                    </div>
                    <div className="info-row">
                      <span>Vehicle Number</span>
                      <div>{selectedLead.vehicleRegistrationNumber || "—"}</div>
                    </div>
                  </div>

                  <div className="profile-section">
                    <h4>Financial Valuation</h4>
                    <div className="info-row">
                      <span>Est. Sale Value</span>
                      <div style={{ fontWeight: "700" }}>
                        ₹ {Number(selectedLead.estimatedSaleValue || 0).toFixed(2)}
                      </div>
                    </div>
                    <div className="info-row">
                      <span>Total Purchase Value</span>
                      <div style={{ fontWeight: "800", color: "#2563eb" }}>
                        ₹ {Number(selectedLead.totalPurchaseValue || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </aside>

          {/* Main Table Panel */}
          <div className={`card panel ${isFullscreen ? "fullscreen-table" : ""}`}>
            {/* Title & Description Header on Top */}
            <div className="panel-header" style={{ marginBottom: "20px", paddingBottom: "16px" }}>
              <div>
                <h2 className="title">ELV Lead Master Records ({statusTab})</h2>
                <div className="desc">
                  Select a row to edit, delete, inspect, or submit lead details for approval.
                </div>
              </div>
            </div>

            {/* Status Filter Tabs on Left & Search Box on Right */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", gap: "16px", flexWrap: "wrap" }}>
              <div className="tabs" style={{ marginBottom: 0 }}>
                {(["Ongoing", "Under Approval", "Approved", "Rejected"] as const).map(
                  (tab) => (
                    <button
                      key={tab}
                      className={`tab ${statusTab === tab ? "active" : ""}`}
                      onClick={() => {
                        setStatusTab(tab);
                        setCurrentPage(1);
                      }}
                    >
                      {tab}
                    </button>
                  )
                )}
              </div>

              <div className="search-wrap" style={{ minWidth: "280px", margin: 0 }}>
                <span className="icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search VIN, supplier, location..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>

            {/* Toolbar */}
            <div className="toolbar">
              <div className="entries-select-wrap" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <label htmlFor="lead-entries-select" style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>
                  Show
                </label>
                <select
                  id="lead-entries-select"
                  value={entriesPerPage}
                  onChange={(e) => {
                    setEntriesPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  style={{ width: "auto" }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span style={{ fontSize: "13px", color: "#64748b" }}>records per page</span>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn-primary" onClick={handleOpenAddModal}>
                  Register New Lead
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => handleOpenEditModal()}
                  disabled={!selectedLead}
                >
                  ✎ Edit
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleDelete()}
                  disabled={!selectedLead}
                >
                  🗑 Delete
                </button>
                <button
                  className={`btn btn-outline ${isRefreshing ? "loading" : ""}`}
                  onClick={() => fetchLeads(false)}
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
                    <th style={{ width: "80px" }}>Lead Id</th>
                    <th>Lead Type</th>
                    <th>Supplier Name</th>
                    <th>Contact</th>
                    <th>Additional Details</th>
                    <th>ELV Location</th>
                    <th>Registered By</th>
                    <th>Registration Date</th>
                    <th>Est. Sale Value</th>
                    <th>Total Purchase Value</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={12} style={{ textAlign: "center", padding: "40px" }}>
                        Loading ELV lead records...
                      </td>
                    </tr>
                  ) : currentEntries.length === 0 ? (
                    <tr>
                      <td colSpan={12} style={{ textAlign: "center", padding: "40px" }}>
                        No ELV lead records found for '{statusTab}' status.
                      </td>
                    </tr>
                  ) : (
                    currentEntries.map((lead) => {
                      const id = lead._id as string;
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
                          <td style={{ fontWeight: "700" }}>{lead.leadId}</td>
                          <td>{lead.leadType}</td>
                          <td className="col-supplier" style={{ fontWeight: "600", textTransform: "uppercase" }}>
                            {lead.supplierName}
                          </td>
                          <td>{lead.contact || "—"}</td>
                          <td className="col-details">
                            {lead.additionalDetails || "—"}
                          </td>
                          <td style={{ textTransform: "uppercase" }}>{lead.elvLocation}</td>
                          <td>{lead.registeredBy}</td>
                          <td className="col-date">
                            {new Date(lead.registrationDate)
                              .toISOString()
                              .replace("T", " ")
                              .slice(0, 16)}
                          </td>
                          <td>₹ {Number(lead.estimatedSaleValue || 0).toFixed(2)}</td>
                          <td style={{ fontWeight: "700", color: "#0f172a" }}>
                            ₹ {Number(lead.totalPurchaseValue || 0).toFixed(2)}
                          </td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              {/* Edit Pencil Icon */}
                              <button
                                onClick={() => handleOpenEditModal(lead)}
                                style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "inline-flex", alignItems: "center" }}
                                title="Edit Lead"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1a202c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polygon points="16 3 21 8 8 21 3 21 3 16 16 3" />
                                </svg>
                              </button>

                              {/* Delete Trash Icon */}
                              <button
                                onClick={() => handleDelete(id, lead.leadId)}
                                style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "inline-flex", alignItems: "center" }}
                                title="Delete Lead"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="#e53e3e" stroke="#e53e3e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                  <line x1="10" y1="11" x2="10" y2="17" />
                                  <line x1="14" y1="11" x2="14" y2="17" />
                                </svg>
                              </button>

                              {/* Submit Button */}
                              <button
                                className="btn-submit-action"
                                disabled={lead.status !== "Ongoing"}
                                onClick={() => handleSubmitStatus(id, lead.leadId)}
                                style={{
                                  backgroundColor: lead.status === "Ongoing" ? "#36c5a6" : "#cbd5e1",
                                  color: "#ffffff",
                                  border: "none",
                                  padding: "3px 8px",
                                  borderRadius: "4px",
                                  fontSize: "9.5px",
                                  fontWeight: "600",
                                  cursor: lead.status === "Ongoing" ? "pointer" : "default",
                                  whiteSpace: "nowrap",
                                  display: "inline-flex",
                                  alignItems: "center"
                                }}
                              >
                                {lead.status === "Ongoing" ? "Submit" : lead.status}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="pagination-wrap" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px" }}>
              <div style={{ fontSize: 13, color: "#64748b" }}>
                Showing {startDisplay} to {endDisplay} of {totalEntries} entries
              </div>

              <div className="pagination-buttons" style={{ display: "flex", gap: "6px" }}>
                <button
                  className="btn btn-outline"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    className={`btn ${currentPage === pageNum ? "btn-primary" : "btn-outline"}`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  className="btn btn-outline"
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

      {/* Add/Edit Modal Window matching Manage Employee theme */}
      {showModal && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className="modal" style={{ maxWidth: "900px" }}>
            <div className="modal-header">
              <div>
                <div className="modal-title">
                  {editingLead ? "Edit ELV Lead" : "Register New ELV Lead"}
                </div>
                <div className="modal-sub">
                  Fill in lead details below. Select 'Individual' for detailed ELV inspection options.
                </div>
              </div>
              <button className="close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="form-grid" style={{ padding: "24px" }}>
                {/* SECTION 1: Supplier Details */}
                <div className="form-section-title">Supplier Details</div>

                <div className="field">
                  <label>
                    Lead Source Type <span className="req">*</span>
                  </label>
                  <select
                    required
                    value={formData.leadType}
                    onChange={(e) => setFormData({ ...formData, leadType: e.target.value })}
                  >
                    <option value="Other">Other</option>
                    <option value="Individual">Individual</option>
                  </select>
                </div>

                <div className="field">
                  <label>Supplier Name</label>
                  <input
                    placeholder="Enter or select supplier"
                    value={formData.supplierName}
                    onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                  />
                </div>

                <div className="field">
                  <label>Facilitator Name</label>
                  <input
                    placeholder="Enter facilitator name"
                    value={formData.facilitatorName}
                    onChange={(e) => setFormData({ ...formData, facilitatorName: e.target.value })}
                  />
                </div>

                {/* DYNAMIC SECTIONS IF INDIVIDUAL IS SELECTED */}
                {formData.leadType === "Individual" && (
                  <>
                    <div className="form-section-title">ELV Owner Details</div>

                    <div className="field">
                      <label>Owner Name</label>
                      <input
                        placeholder="Enter owner name"
                        value={formData.ownerName}
                        onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                      />
                    </div>

                    <div className="field">
                      <label>
                        Mobile Number <span className="req">*</span>
                      </label>
                      <input
                        placeholder="Enter phone number"
                        value={formData.mobileNumber}
                        onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                      />
                    </div>

                    <div className="field">
                      <label>Email Id</label>
                      <input
                        type="email"
                        placeholder="Enter email id"
                        value={formData.emailId}
                        onChange={(e) => setFormData({ ...formData, emailId: e.target.value })}
                      />
                    </div>

                    <div className="field">
                      <label>Vehicle Current Location</label>
                      <input
                        placeholder="Enter location of vehicle"
                        value={formData.vehicleCurrentLocation}
                        onChange={(e) => setFormData({ ...formData, vehicleCurrentLocation: e.target.value })}
                      />
                    </div>

                    <div className="form-section-title">ELV Details</div>

                    <div className="field">
                      <label>
                        Vehicle Registration Number <span className="req">*</span>
                      </label>
                      <input
                        placeholder="Enter vehicle number"
                        value={formData.vehicleRegistrationNumber}
                        onChange={(e) => setFormData({ ...formData, vehicleRegistrationNumber: e.target.value })}
                      />
                    </div>

                    <div className="field">
                      <label>Vehicle Type</label>
                      <select
                        value={formData.vehicleType}
                        onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                      >
                        <option value="">Select vehicle type</option>
                        <option value="2 Wheeler">2 Wheeler</option>
                        <option value="4 Wheeler">4 Wheeler</option>
                        <option value="4+ Wheeler">4+ Wheeler</option>
                        <option value="Commercial">Commercial</option>
                      </select>
                    </div>

                    <div className="field">
                      <label>Vehicle Name</label>
                      <input
                        placeholder="e.g. Saloon, Swift, City"
                        value={formData.vehicleName}
                        onChange={(e) => setFormData({ ...formData, vehicleName: e.target.value })}
                      />
                    </div>

                    <div className="field">
                      <label>
                        Model Year <span className="req">*</span>
                      </label>
                      <input
                        placeholder="e.g. 2001"
                        value={formData.modelYear}
                        onChange={(e) => setFormData({ ...formData, modelYear: e.target.value })}
                      />
                    </div>

                    <div className="field">
                      <label>Vehicle Class</label>
                      <select
                        value={formData.vehicleClass}
                        onChange={(e) => setFormData({ ...formData, vehicleClass: e.target.value })}
                      >
                        <option value="">Select vehicle class</option>
                        <option value="LCV">LCV</option>
                        <option value="HCV">HCV</option>
                        <option value="Mini">Mini</option>
                        <option value="Micro">Micro</option>
                        <option value="Compact">Compact</option>
                        <option value="Mid-Size">Mid-Size</option>
                        <option value="Luxury">Luxury</option>
                        <option value="Utility Vehicles">Utility Vehicles</option>
                        <option value="LMV">LMV</option>
                        <option value="HMV">HMV</option>
                        <option value="Test Class 3">Test Class 3</option>
                        <option value="Test Sedan">Test Sedan</option>
                        <option value="Test Class Name">Test Class Name</option>
                        <option value="Hatchback">Hatchback</option>
                        <option value="Test">Test</option>
                        <option value="2WHEELER">2WHEELER</option>
                      </select>
                    </div>

                    <div className="field">
                      <label>
                        Vehicle Category <span className="req">*</span>
                      </label>
                      <select
                        value={formData.vehicleCategory}
                        onChange={(e) => setFormData({ ...formData, vehicleCategory: e.target.value })}
                      >
                        <option value="">Select vehicle category</option>
                        <option value="HATCHBACK">HATCHBACK</option>
                        <option value="HOT HATCHBACK">HOT HATCHBACK</option>
                        <option value="COMPACT">COMPACT</option>
                        <option value="SEDAN">SEDAN</option>
                        <option value="EXECUTIVE SEDAN">EXECUTIVE SEDAN</option>
                        <option value="LUXURY SEDAN">LUXURY SEDAN</option>
                        <option value="SALOON">SALOON</option>
                        <option value="SUV">SUV</option>
                        <option value="COMPACT SUV">COMPACT SUV</option>
                        <option value="FULL SIZE SUV">FULL SIZE SUV</option>
                        <option value="LUXURY SUV">LUXURY SUV</option>
                        <option value="CROSSOVER">CROSSOVER</option>
                        <option value="COMPACT CROSSOVER">COMPACT CROSSOVER</option>
                        <option value="LUXURY CROSSOVER">LUXURY CROSSOVER</option>
                        <option value="SPORTS">SPORTS</option>
                        <option value="SUPER CAR">SUPER CAR</option>
                        <option value="ULTRA LUXURY">ULTRA LUXURY</option>
                        <option value="MINIVAN">MINIVAN</option>
                        <option value="PICK UP TRUCK">PICK UP TRUCK</option>
                        <option value="BUS MUV">BUS MUV</option>
                        <option value="PREMIUM MUV">PREMIUM MUV</option>
                        <option value="COUPE">COUPE</option>
                        <option value="FASTBACK">FASTBACK</option>
                        <option value="STATION WAGON">STATION WAGON</option>
                        <option value="LONG HAUL BUS">LONG HAUL BUS</option>
                        <option value="LONG HAUL TRUCK">LONG HAUL TRUCK</option>
                        <option value="TRANSIT MIXTURE">TRANSIT MIXTURE</option>
                        <option value="YRUCK">YRUCK</option>
                        <option value="BIKE">BIKE</option>
                        <option value="SCOOTER">SCOOTER</option>
                        <option value="MOTOR CYCLE">MOTOR CYCLE</option>
                        <option value="NAKED BIKE">NAKED BIKE</option>
                        <option value="CRUISER">CRUISER</option>
                        <option value="ADVENTURE BIKE">ADVENTURE BIKE</option>
                        <option value="AUTO RICKSHAW">AUTO RICKSHAW</option>
                        <option value="TEST">TEST</option>
                        <option value="HERO HONDO">HERO HONDO</option>
                        <option value="MAHINDRA">MAHINDRA</option>
                      </select>
                    </div>

                    <div className="field">
                      <label>Fuel Type</label>
                      <select
                        value={formData.fuelType}
                        onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                      >
                        <option value="">Select fuel type</option>
                        <option value="Petrol">Petrol</option>
                        <option value="Diesel">Diesel</option>
                        <option value="CNG">CNG</option>
                        <option value="Electric">Electric</option>
                        <option value="LPG">LPG</option>
                        <option value="Hybrid">Hybrid</option>
                        <option value="Bio Diesel">Bio Diesel</option>
                        <option value="Ethanol-based Petrol">Ethanol-based Petrol</option>
                        <option value="Natural Gas123">Natural Gas123</option>
                        <option value="Natural Gas">Natural Gas</option>
                        <option value="C2H5OH">C2H5OH</option>
                        <option value="H2O">H2O</option>
                        <option value="Engine Oil">Engine Oil</option>
                        <option value="Petrol CNG">Petrol CNG</option>
                      </select>
                    </div>

                    <div className="field">
                        <label>Vehicle Usage type</label>
                        <select
                          value={formData.vehicleUsageType}
                          onChange={(e) => setFormData({ ...formData, vehicleUsageType: e.target.value })}
                        >
                          <option value="">Select vehicle usage type</option>
                          <option value="Personal">Personal</option>
                          <option value="Commercial">Commercial</option>
                          <option value="Rental">Rental</option>
                          <option value="Government">Government</option>
                          <option value="Emergency">Emergency</option>
                          <option value="Public">Public</option>
                          <option value="Test Personal">Test Personal</option>
                          <option value="Personal and Public">Personal and Public</option>
                          <option value="Business">Business</option>
                          <option value="ferros">ferros</option>
                          <option value="PRSONAL">PRSONAL</option>
                          <option value="PLASTIC">PLASTIC</option>
                        </select>
                      </div>

                    <div className="form-section-title">ELV Inspection</div>

                    <div className="field">
                      <label>Mobility Condition</label>
                      <select
                        value={formData.mobilityCondition}
                        onChange={(e) => setFormData({ ...formData, mobilityCondition: e.target.value })}
                      >
                        <option value="">Select option</option>
                        <option value="Running">Running</option>
                        <option value="Towable">Towable</option>
                        <option value="Non-mobile">Non-mobile</option>
                      </select>
                    </div>

                    <div className="field">
                      <label>Engine Working Condition</label>
                      <select
                        value={formData.engineWorkingCondition}
                        onChange={(e) => setFormData({ ...formData, engineWorkingCondition: e.target.value })}
                      >
                        <option value="">Select option</option>
                        <option value="Working">Working</option>
                        <option value="Non-working">Non-working</option>
                        <option value="Missing">Missing</option>
                      </select>
                    </div>

                    <div className="field">
                      <label>Battery</label>
                      <select
                        value={formData.battery}
                        onChange={(e) => setFormData({ ...formData, battery: e.target.value })}
                      >
                        <option value="">Select option</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>

                    <div className="field">
                      <label>Stepney</label>
                      <select
                        value={formData.stepney}
                        onChange={(e) => setFormData({ ...formData, stepney: e.target.value })}
                      >
                        <option value="">Select option</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>

                    <div className="field">
                      <label>Tyres</label>
                      <select
                        value={formData.tyres}
                        onChange={(e) => setFormData({ ...formData, tyres: e.target.value })}
                      >
                        <option value="">Select option</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>

                    <div className="field">
                      <label>Alloys</label>
                      <select
                        value={formData.alloys}
                        onChange={(e) => setFormData({ ...formData, alloys: e.target.value })}
                      >
                        <option value="">Select option</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>

                    <div className="field">
                      <label>Steel Rims</label>
                      <select
                        value={formData.steelRims}
                        onChange={(e) => setFormData({ ...formData, steelRims: e.target.value })}
                      >
                        <option value="">Select option</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                  </>
                )}

                {/* SECTION 4: Purchase Details */}
                <div className="form-section-title">Purchase Details</div>

                <div className="purchase-section-wrap">
                  <div className="purchase-fields-col">
                    <div className="field">
                      <label>
                        Lead Value <span className="req">*</span>
                      </label>
                      <input
                        type="number"
                        placeholder="Enter lead value"
                        value={formData.leadValue}
                        onChange={(e) => setFormData({ ...formData, leadValue: e.target.value })}
                      />
                    </div>

                    <div className="field">
                      <label>Additional Fee/ Tax Amount</label>
                      <input
                        type="number"
                        placeholder="Enter amount"
                        value={formData.additionalFee}
                        onChange={(e) => setFormData({ ...formData, additionalFee: e.target.value })}
                      />
                    </div>

                    <div className="field">
                      <label>Freight/ Transit Charges</label>
                      <input
                        type="number"
                        placeholder="Enter amount"
                        value={formData.freightCharges}
                        onChange={(e) => setFormData({ ...formData, freightCharges: e.target.value })}
                      />
                    </div>

                    <div className="field">
                      <label>Other Charges</label>
                      <input
                        type="number"
                        placeholder="Enter amount"
                        value={formData.otherCharges}
                        onChange={(e) => setFormData({ ...formData, otherCharges: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Summary Box */}
                  <div className="summary-amount-box">
                    <div className="summary-amount-title">Total ELVs</div>
                    <div className="summary-amount-val" style={{ marginBottom: "12px" }}>
                      {formData.leadType === "Individual" ? 1 : 0}
                    </div>
                    <div className="summary-amount-title">Total Purchase Amount</div>
                    <div className="summary-amount-val">
                      ₹ {calculatedTotalPurchase.toLocaleString("en-IN")}
                    </div>
                  </div>
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
                <button type="submit" className="btn btn-primary">
                  {editingLead ? "Save Changes" : "Register ELV Lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
