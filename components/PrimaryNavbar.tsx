"use client";

import React, { useState } from "react";
import Link from "next/link";
import { menuSections } from "../lib/navigation";

export default function PrimaryNavbar() {
  const [showMegaMenu, setShowMegaMenu] = useState(false);

  return (
    <>
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
            <Link href="/" className="home-nav-item">Dashboard</Link>
            <Link href="#" className="home-nav-item">Reports</Link>
            <Link href="#" className="home-nav-item">Settings</Link>
          </div>

          <div className="nav-right-section">
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

            <button 
              className="mega-nav-btn" 
              onClick={() => setShowMegaMenu(true)}
            >
              Menu <span className="icon">☰</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mega Menu Overlay */}
      {showMegaMenu && (
        <div className="mega-menu-overlay" onClick={() => setShowMegaMenu(false)}>
          <div className="mega-menu-content" onClick={(e) => e.stopPropagation()}>
            <div className="mega-menu-header">
              <div className="mega-menu-brand">ScrapCentre Pro · Navigation</div>
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
                        href={item.includes("Employees") ? "/employee" : item.includes("Organization") ? "/organization" : item.includes("RVSFs") ? "/rvsf" : item.includes("Designation") ? "/designation" : item.includes("ELV Leads") ? "/elv-leads" : "#"} 
                        className="menu-sub-item"
                        onClick={() => setShowMegaMenu(false)}
                      >
                        {item}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
