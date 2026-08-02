"use client";

import React, { useState } from "react";
import Link from "next/link";
import "./home.css";
import SubNavbar from "../components/SubNavbar";
import PrimaryNavbar from "../components/PrimaryNavbar";

export default function Home() {
  const stats = [
    { label: "Yet to Start", value: "0" },
    { label: "Digital Inspections", value: "0" },
    { label: "Certificates of Deposit", value: "0" },
    { label: "Under De-pollution", value: "0" },
    { label: "Under Dismantling", value: "0" },
    { label: "Certificates of Destruction", value: "0" },
  ];

  return (
    <div className="home-page">
      {/* Centralized Primary Navbar with Mega Menu */}
      <PrimaryNavbar />

      {/* Shared Sub-Navbar with Breadcrumbs */}
      <SubNavbar activeTab="Shop Floor" currentPage="Dashboard" />

      {/* Summary Stats Cards */}
      <div className="stats-grid">
        {stats.map((stat, idx) => (
          <div key={idx} className="stat-card">
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
    </div>
  );
}
