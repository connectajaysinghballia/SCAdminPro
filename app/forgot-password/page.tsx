'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import '../login/login.css';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setIsSent(false);
    setError('');

    try {
      if (!email) {
        setError('Please enter your email.');
        setIsLoading(false);
        return;
      }

      console.log('Resetting password for:', email);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIsSent(true);
    } catch (err) {
      setError('Password reset failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-shape shape-1"></div>
      <div className="login-bg-shape shape-2"></div>

      <div className="login-card">
        <div className="login-header">
          <Image 
            src="/nts.png" 
            alt="ScrapCentre Logo" 
            width={120} 
            height={48} 
            className="login-logo"
            priority
          />
          <h1 className="login-title">Reset Password</h1>
          <p className="login-subtitle">We'll send you a link to reset your account credentials.</p>
        </div>

        {error && (
          <div className="error-message">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        {isSent ? (
          <div style={{ textAlign: 'center', margin: '20px 0' }}>
            <div style={{ fontSize: '15px', color: '#10b981', fontWeight: 600, padding: '16px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '14px', border: '1px solid rgba(16, 185, 129, 0.2)' }}> 
               Password reset link sent! Check your inbox.
            </div>
            <Link href="/login" className="login-button" style={{ display: 'block', marginTop: '24px', textDecoration: 'none' }}>Return to Login</Link>
          </div>
        ) : (
          <form className="login-form" onSubmit={handleReset}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-wrapper">
                <div className="input-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <input 
                  type="email" 
                  placeholder="name@company.com" 
                  className="login-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="login-button" 
              disabled={isLoading}
            >
              {isLoading ? "Sending Link..." : "Send Reset Link"}
            </button>
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <Link href="/login" className="forgot-password">Back to Sign In</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
