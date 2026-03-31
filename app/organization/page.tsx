"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
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
}

const API_URL = "/api/organizations";

export default function OrganizationPortal() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
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
    setTimeout(() => setToast({ show: false, title: "", msg: "" }), 3000);
  };

  const fetchOrganizations = async () => {
    try {
      const res = await fetch(`${API_URL}?search=${search}`);
      const data = await res.json();
      if (data.success) {
        setOrganizations(data.data);
      }
    } catch (err) {
      showToast("Error", "Failed to fetch data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
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
        showToast("Success", "Organization added successfully.");
        setShowAddModal(false);
        setFormData({ name: "", gst: "", contactNumber: "", contactPerson: "", email: "", location: "", state: "", city: "", pincode: "" });
        fetchOrganizations();
      }
    } catch (err) {
      showToast("Error", "Network or server error.");
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrg?._id) return;
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
        fetchOrganizations();
      }
    } catch (err) {
      showToast("Error", "Update failed.");
    }
  };

  const handleDelete = async () => {
    if (!selectedOrg?._id) return;
    if (!confirm("Are you sure you want to delete this organization?")) return;
    try {
      const res = await fetch(`${API_URL}/${selectedOrg._id}`, { method: "DELETE" });
      const result = await res.json();
      if (result.success) {
        showToast("Success", "Organization deleted.");
        setSelectedOrg(null);
        fetchOrganizations();
      }
    } catch (err) {
      showToast("Error", "Delete failed.");
    }
  };

  const openEdit = (org: Organization) => {
    setSelectedOrg(org);
    setFormData(org);
    setShowEditModal(true);
  };

  return (
    <div className="employee-portal">
      {toast.show && (
        <div className="toast">
          <strong>{toast.title}</strong>
          {toast.msg}
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
            <span className="profile-name">Admin User</span>
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
            <span>Home</span> <span className="separator">›</span> <span>Manage Organization</span> <span className="separator">›</span> <span className="current">Master Grid</span>
          </div>
        </div>
      </div>

      <div className="container">
        <section className="hero card">
          <div>
            <h1>Organization Info</h1>
            <p className="sub">Manage and track organization details, GST, and contact points below.</p>
          </div>
          <div className="actions">
            <button className="btn btn-primary" onClick={() => { setShowAddModal(true); setFormData({ name: "", gst: "", contactNumber: "", contactPerson: "", email: "", location: "", state: "", city: "", pincode: "" }); }}>
              <span style={{ fontSize: '20px' }}>+</span> Add Organization
            </button>
          </div>
        </section>

        <div className="panel">
          <div className="panel-header">
            <div>
              <h2 className="title">Organization List</h2>
              <p className="desc">Total {organizations.length} entries found</p>
            </div>
            <div className="toolbar">
              <div className="search-wrap">
                <span className="icon">🔍</span>
                <input 
                  type="text" 
                  placeholder="Search by name, person or location..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button className="btn btn-outline" disabled={!selectedOrg} onClick={() => selectedOrg && openEdit(selectedOrg)}>Edit</button>
              <button className="btn btn-danger" disabled={!selectedOrg} onClick={handleDelete}>Delete</button>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>S No.</th>
                  <th>Name</th>
                  <th>Gst</th>
                  <th>Contact nbr</th>
                  <th>Cntct person name</th>
                  <th>Email id</th>
                  <th>Location name</th>
                  <th>State</th>
                  <th>City</th>
                  <th>Pincode</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={10} style={{ textAlign: 'center', padding: '40px' }}>Loading...</td></tr>
                ) : organizations.length === 0 ? (
                  <tr><td colSpan={10} style={{ textAlign: 'center', padding: '40px' }}>No entries found</td></tr>
                ) : organizations.map((org, index) => (
                  <tr 
                    key={org._id} 
                    onClick={() => setSelectedOrg(org)}
                    className={selectedOrg?._id === org._id ? "selected" : ""}
                  >
                    <td>{index + 1}</td>
                    <td style={{ fontWeight: '700' }}>{org.name}</td>
                    <td>{org.gst || "—"}</td>
                    <td>{org.contactNumber || "—"}</td>
                    <td>{org.contactPerson || "—"}</td>
                    <td>{org.email || "—"}</td>
                    <td>{org.location || "—"}</td>
                    <td>{org.state || "—"}</td>
                    <td>{org.city || "—"}</td>
                    <td>{org.pincode || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div>
                <h3 className="modal-title">{showAddModal ? "Add New Organization" : "Edit Organization"}</h3>
                <p className="modal-sub">{showAddModal ? "Enter company and contact details below." : "Modify organization information."}</p>
              </div>
              <button className="close" onClick={() => { setShowAddModal(false); setShowEditModal(false); }}>×</button>
            </div>
            <form onSubmit={showAddModal ? handleAddSubmit : handleEditSubmit}>
              <div className="form-grid">
                <div className="field">
                  <label>Organization Name <span className="req">*</span></label>
                  <input required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="field">
                  <label>Gst</label>
                  <input value={formData.gst} onChange={(e) => setFormData({...formData, gst: e.target.value})} />
                </div>
                <div className="field">
                  <label>Cntct person name</label>
                  <input value={formData.contactPerson} onChange={(e) => setFormData({...formData, contactPerson: e.target.value})} />
                </div>
                <div className="field">
                  <label>Contact nbr</label>
                  <input value={formData.contactNumber} onChange={(e) => setFormData({...formData, contactNumber: e.target.value})} />
                </div>
                <div className="field">
                  <label>Email id</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className="field">
                  <label>Location name</label>
                  <input value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} />
                </div>
                <div className="field">
                  <label>City</label>
                  <input value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} />
                </div>
                <div className="field">
                  <label>State</label>
                  <input value={formData.state} onChange={(e) => setFormData({...formData, state: e.target.value})} />
                </div>
                <div className="field">
                  <label>Pincode</label>
                  <input value={formData.pincode} onChange={(e) => setFormData({...formData, pincode: e.target.value})} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowAddModal(false); setShowEditModal(false); }}>Cancel</button>
                <button type="submit" className="btn btn-primary">{showAddModal ? "Add Organization" : "Save Changes"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
