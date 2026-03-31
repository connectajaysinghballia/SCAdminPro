"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
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
}

const API_URL = "/api/rvsfs";

export default function RvsfPortal() {
  const [rvsfs, setRvsfs] = useState<Rvsf[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRvsf, setSelectedRvsf] = useState<Rvsf | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMegaMenu, setShowMegaMenu] = useState(false);
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

  const showToast = (title: string, msg: string) => {
    setToast({ show: true, title, msg });
    setTimeout(() => setToast({ show: false, title: "", msg: "" }), 3000);
  };

  const fetchRvsfs = async () => {
    try {
      const res = await fetch(`${API_URL}?search=${search}`);
      const data = await res.json();
      if (data.success) {
        setRvsfs(data.data);
      }
    } catch (err) {
      showToast("Error", "Failed to fetch RVSF data.");
    } finally {
      setLoading(false);
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
    fetchRvsfs();
    fetchDynamicOrgs();
  }, [search]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await res.json();
      if (result.success) {
        showToast("Success", "RVSF added successfully.");
        setShowAddModal(false);
        setFormData({ organizationName: "", name: "", contactPerson: "", contactNumber: "", email: "", address: "", locationName: "", pincode: "" });
        fetchRvsfs();
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
        showToast("Success", "RVSF updated successfully.");
        setShowEditModal(false);
        fetchRvsfs();
      }
    } catch (err) {
      showToast("Error", "Update failed.");
    }
  };

  const handleDelete = async () => {
    if (!selectedRvsf?._id) return;
    if (!confirm("Are you sure you want to delete this RVSF?")) return;
    try {
      const res = await fetch(`${API_URL}/${selectedRvsf._id}`, { method: "DELETE" });
      const result = await res.json();
      if (result.success) {
        showToast("Success", "RVSF deleted successfully.");
        setSelectedRvsf(null);
        fetchRvsfs();
      }
    } catch (err) {
      showToast("Error", "Delete failed.");
    }
  };

  const openEdit = (rvsf: Rvsf) => {
    setSelectedRvsf(rvsf);
    setFormData(rvsf);
    setShowEditModal(true);
  };

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

      {toast.show && (
        <div className="toast show" style={{ display: 'block' }}>
          <strong>{toast.title}</strong>
          <div>{toast.msg}</div>
        </div>
      )}

      {/* Slim Navbar */}
      <nav className="slim-navbar">
        <div className="nav-container">
          <div className="nav-logo">
            <img src="/nts.png" alt="NTS Logo" onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              const parent = (e.target as HTMLImageElement).parentElement;
              if (parent) parent.innerHTML = '<div class="logo-placeholder">NTS</div>';
            }} />
          </div>
          <div className="nav-title">ScrapCentre Pro</div>
          <div className="nav-links">
            <Link href="/" style={{ textDecoration: 'none' }}><span className="nav-item">Dashboard</span></Link>
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
            <Link href="/rvsf" className="breadcrumb-item active current">Manage RVSFs</Link>
          </div>
        </div>
      </div>

      <div className="container">
        <section className="hero card">
          <div>
            <div className="pill">🏭 RVSF Management</div>
            <h1>RVSF Info</h1>
            <p className="sub">Add, manage, and track Registered Vehicle Scrapping Facilities (RVSF) across organizations.</p>
          </div>
          <div className="actions">
            <button className="btn btn-primary" onClick={() => { setShowAddModal(true); setFormData({ organizationName: "", name: "", contactPerson: "", contactNumber: "", email: "", address: "", locationName: "", pincode: "" }); }}>
              <span style={{ fontSize: '20px' }}>+</span> Add RVSF
            </button>
          </div>
        </section>

        <div className="panel card" style={{ padding: '0px' }}>
          <div className="panel-header" style={{ padding: '24px' }}>
            <div>
              <h2 className="title">RVSF Master List</h2>
              <p className="desc">Listing of all registered scrapping facilities in the network.</p>
            </div>
            <div className="toolbar">
              <div className="search-wrap">
                <span className="icon">🔍</span>
                <input 
                  type="text" 
                  placeholder="Search RVSF, contact or location..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button className="btn btn-primary" onClick={() => { setShowAddModal(true); setFormData({ organizationName: "", name: "", contactPerson: "", contactNumber: "", email: "", address: "", locationName: "", pincode: "" }); }}>+ Add RHSV</button>
              <button className="btn btn-outline" disabled={!selectedRvsf} onClick={() => selectedRvsf && openEdit(selectedRvsf)}>✎ Edit</button>
              <button className="btn btn-danger" disabled={!selectedRvsf} onClick={handleDelete}>🗑 Delete</button>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>S No.</th>
                  <th>Organization name</th>
                  <th>Rvsf name</th>
                  <th>Contact person</th>
                  <th>Contact nbr</th>
                  <th>Email</th>
                  <th>Address</th>
                  <th>Location name</th>
                  <th>Pincode</th>
                  <th>Created by</th>
                  <th>Created on</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={11} style={{ textAlign: 'center', padding: '40px' }}>Loading RVSF data...</td></tr>
                ) : rvsfs.length === 0 ? (
                  <tr><td colSpan={11} style={{ textAlign: 'center', padding: '40px' }}>No RVSF records found.</td></tr>
                ) : rvsfs.map((rvsf, index) => (
                  <tr 
                    key={rvsf._id} 
                    onClick={() => setSelectedRvsf(rvsf)}
                    className={selectedRvsf?._id === rvsf._id ? "selected" : ""}
                  >
                    <td>{index + 1}</td>
                    <td style={{ fontWeight: '500' }}>{rvsf.organizationName}</td>
                    <td style={{ fontWeight: '700' }}>{rvsf.name}</td>
                    <td>{rvsf.contactPerson || "—"}</td>
                    <td>{rvsf.contactNumber || "—"}</td>
                    <td>{rvsf.email || "—"}</td>
                    <td><div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rvsf.address || "—"}</div></td>
                    <td>{rvsf.locationName || "—"}</td>
                    <td>{rvsf.pincode || "—"}</td>
                    <td><span className="badge tag">{rvsf.createdBy || "Admin"}</span></td>
                    <td style={{ fontSize: '11px' }}>{rvsf.createdAt ? new Date(rvsf.createdAt).toLocaleString('en-IN') : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="footer-note" style={{ padding: '16px 24px' }}>
            <div>Total {rvsfs.length} facility records</div>
            <div>{selectedRvsf ? `Selected: ${selectedRvsf.name}` : "Click a row to manage facility details"}</div>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="modal-overlay" onClick={(e) => { if(e.target === e.currentTarget) { setShowAddModal(false); setShowEditModal(false); } }}>
          <div className="modal">
            <div className="modal-header">
              <div>
                <h3 className="modal-title">{showAddModal ? "Register New RVSF" : "Edit RVSF Details"}</h3>
                <p className="modal-sub">Ensure all facility contact information is accurate for portal access.</p>
              </div>
              <button className="close" onClick={() => { setShowAddModal(false); setShowEditModal(false); }}>×</button>
            </div>
            <form onSubmit={showAddModal ? handleAddSubmit : handleEditSubmit}>
              <div className="form-grid">
                <div className="field">
                  <label>Organization name <span className="req">*</span></label>
                  <select required value={formData.organizationName} onChange={(e) => setFormData({...formData, organizationName: e.target.value})}>
                    <option value="">Select Organization</option>
                    {dynamicOrgs.map(org => <option key={org} value={org}>{org}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Rvsf name <span className="req">*</span></label>
                  <input required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. SCRAP CENTRE" />
                </div>
                <div className="field">
                  <label>Contact person</label>
                  <input value={formData.contactPerson} onChange={(e) => setFormData({...formData, contactPerson: e.target.value})} placeholder="Full Name" />
                </div>
                <div className="field">
                  <label>Contact number</label>
                  <input value={formData.contactNumber} onChange={(e) => setFormData({...formData, contactNumber: e.target.value})} placeholder="Mobile Number" />
                </div>
                <div className="field">
                  <label>Email ID</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="facility@email.com" />
                </div>
                <div className="field">
                  <label>Location name</label>
                  <input value={formData.locationName} onChange={(e) => setFormData({...formData, locationName: e.target.value})} placeholder="e.g. Dibiyapur" />
                </div>
                <div className="field">
                  <label>Pincode</label>
                  <input value={formData.pincode} onChange={(e) => setFormData({...formData, pincode: e.target.value})} placeholder="6-digit PIN" />
                </div>
                <div className="field" style={{ gridColumn: 'span 2' }}>
                  <label>Full Address</label>
                  <input value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} placeholder="Street, Industrial Area, Building..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => { setShowAddModal(false); setShowEditModal(false); }}>Cancel</button>
                <button type="submit" className="btn btn-primary">{showAddModal ? "Register Facility" : "Save RVSF Changes"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
