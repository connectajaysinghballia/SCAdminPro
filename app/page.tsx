"use client";

import React, { useState } from "react";
import Link from "next/link";
import "./home.css";

export default function Home() {
  const [activeSubTab, setActiveSubTab] = useState("Shop Floor");
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [showMegaMenu, setShowMegaMenu] = useState(false);

  const stats = [
    { label: "Yet to Start", value: "0", icon: "🛠️" },
    { label: "Digital Inspections", value: "0", icon: "📋" },
    { label: "Certificates of Deposit", value: "0", icon: "🚛" },
    { label: "Under De-pollution", value: "0", icon: "🧼" },
    { label: "Under Dismantling", value: "0", icon: "🔨" },
    { label: "Certificates of Destruction", value: "0", icon: "📄" },
  ];

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

  return (
    <div className="home-page" onClick={() => { setIsAccountMenuOpen(false); }}>
      {/* Mega Menu Overlay */}
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

      {/* Primary Navbar */}
      <nav className="home-navbar">
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
          <div className="home-nav-links">
            <Link href="/" className="home-nav-item active">Dashboard</Link>
            <Link href="#" className="home-nav-item">Reports</Link>
            <Link href="#" className="home-nav-item">Settings</Link>
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

      {/* Secondary Navbar / Menu */}
      <nav className="sub-navbar">
        <Link href="/" className="sub-nav-home" title="Home">🏠</Link>
        <Link 
          href="/employee" 
          className={`sub-nav-item ${activeSubTab === "Shop Floor" ? "active" : ""}`}
          onClick={() => setActiveSubTab("Shop Floor")}
        >
          Shop Floor
        </Link>
        <Link 
          href="/employee" 
          className={`sub-nav-item ${activeSubTab === "Manage Employees" ? "active" : ""}`}
          onClick={() => setActiveSubTab("Manage Employees")}
        >
          Manage Employees
        </Link>
        <Link 
          href="/organization" 
          className={`sub-nav-item ${activeSubTab === "Manage Organization" ? "active" : ""}`}
          onClick={() => setActiveSubTab("Manage Organization")}
        >
          Manage Organization
        </Link>
        <Link 
          href="/rvsf" 
          className={`sub-nav-item ${activeSubTab === "Manage RVSFs" ? "active" : ""}`}
          onClick={() => setActiveSubTab("Manage RVSFs")}
        >
          Manage RVSFs
        </Link>
      </nav>

      {/* Summary Stats Cards */}
      <div className="stats-grid">
        {stats.map((stat, idx) => (
          <div key={idx} className="stat-card">
            <div className="stat-icon-wrap">{stat.icon}</div>
            <div className="stat-content">
               <div className="stat-label">{stat.label}</div>
               <div className="stat-value">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filter Section */}
      <section className="search-container">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input 
            type="text" 
            className="search-input" 
            placeholder="Search registrations, VIN, or owner..." 
          />
          <div className="search-icons">
             <span title="Voice search" style={{ cursor: 'pointer' }}>🎤</span>
             <span title="Barcode scanner" style={{ cursor: 'pointer' }}>📱</span>
          </div>
        </div>
        
        <div className="filter-row">
           <div className="filter-box" style={{ cursor: 'pointer' }}>
             <span>📍</span> Dibiyapur <span style={{ fontSize: '10px' }}>▼</span>
           </div>
           <div className="filter-box" style={{ cursor: 'pointer' }}>
             <span>📅</span> 30-03-2026 <span style={{ fontSize: '10px' }}>▼</span>
           </div>
        </div>

        <div className="main-content">
          <div className="empty-state" style={{ textAlign: 'center' }}>
            Total entries 0
          </div>
          
          <div className="pagination">
            <button className="page-btn active">Prev</button>
            <button className="page-btn active">1</button>
            <button className="page-btn active">Next</button>
          </div>
        </div>
      </section>

      {/* Footer Area */}
      <footer className="home-footer">
        <div className="footer-links">
          <div className="footer-item">✉️ servicedesk@shamroh.com</div>
          <div className="footer-item">📞 +91 9121223602</div>
          <div className="footer-item">📞 +91 9121223602/10</div>
        </div>
        <div className="footer-links">
           <div className="footer-item">© 2026 - Powered by Shamroh Technologies. ALL RIGHTS RESERVED</div>
        </div>
      </footer>

      {/* Instant Support Floating Button */}
      <div className="support-badge">
        INSTANT SUPPORT!
      </div>
    </div>
  );
}

