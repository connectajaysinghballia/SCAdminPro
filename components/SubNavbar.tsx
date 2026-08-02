"use client";

import React, { useState } from "react";
import Link from "next/link";
import { menuSections } from "../lib/navigation";

interface SubNavbarProps {
  activeTab?: string;
  currentPage?: string;
}

export default function SubNavbar({ activeTab: initialTab, currentPage }: SubNavbarProps) {
  const [activeSubTab, setActiveSubTab] = useState(initialTab || "Shop Floor");

  return (
    <nav className="sub-navbar">
      <div className="sub-nav-history">
        <button className="sub-nav-history-btn" onClick={() => window.history.back()} title="Back">‹</button>
        <button className="sub-nav-history-btn" onClick={() => window.history.forward()} title="Forward">›</button>
        <Link href="/" className="sub-nav-history-btn home-btn" title="Home">⌂</Link>
      </div>
      <div className="sub-nav-divider" />
      
      {currentPage && (
        <>
          <div className="sub-nav-breadcrumb">
            <Link href="/" className="breadcrumb-link">Home</Link>
            <div className="breadcrumb-divider"></div>
            <span className="breadcrumb-current">{currentPage}</span>
          </div>
          <div className="sub-nav-divider" />
        </>
      )}

      {menuSections.map((section, idx) => (
        <div key={idx} className="sub-nav-item-wrapper">
          <Link 
            href="#" 
            className={`sub-nav-item ${activeSubTab === section.title ? "active" : ""}`}
            onClick={() => setActiveSubTab(section.title)}
          >
            {section.title}
            {section.items && section.items.length > 0 && <span className="chevron-down">▼</span>}
          </Link>
          
          {section.items && section.items.length > 0 && (
            <div className="sub-nav-dropdown">
              {section.items.map((subItem, sIdx) => (
                <Link 
                  key={sIdx} 
                  href={subItem.includes("Employees") ? "/employee" : subItem.includes("Organization") ? "/organization" : subItem.includes("RVSFs") ? "/rvsf" : subItem.includes("Designation") ? "/designation" : subItem.includes("ELV Leads") ? "/elv-leads" : "#"} 
                  className="dropdown-item"
                >
                  {subItem}
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  );
}
