import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { sendEmail } from '../lib/resend';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [isAnnual, setIsAnnual] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  // Auth states
  const [email, setEmail] = useState('');
  const [employeeEmail, setEmployeeEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Signup form states
  const [signupData, setSignupData] = useState({
    name: '',
    orgName: '',
    orgEmail: '',
    phone: '',
    offerLetter: null as File | null
  });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const reveals = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    reveals.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const openModal = (id: string) => {
    setActiveModal(id);
    setError(null);
    document.body.style.overflow = 'hidden';
  };

  const closeModals = () => {
    setActiveModal(null);
    document.body.style.overflow = '';
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Enforce strict Supabase Auth
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      // Fetch profile from database to verify role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user?.id)
        .single();

      if (profileError || !profile || profile.role !== 'admin') {
        // If the profile exists and is NOT admin, deny access.
        // If it doesn't exist yet, we allow login since AuthContext fetchProfile will auto-create it.
        if (profile && profile.role !== 'admin') {
          await supabase.auth.signOut();
          setError('Access denied. This account is an employee, please use the Employee Portal.');
          setLoading(false);
          return;
        }
      }

      navigate('/dashboard');
      closeModals();
    } catch (err: any) {
      console.error('Login system error:', err);
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let targetEmail = employeeEmail.trim();

      // 1. Try to find the email in localStorage (ideal for local testing)
      const localCreds = JSON.parse(localStorage.getItem('hr_employee_credentials') || '[]');
      const foundLocal = localCreds.find((c: any) => c.employeeId === targetEmail);

      if (foundLocal && foundLocal.email) {
        targetEmail = foundLocal.email;
      } else {
        // 2. Query database to resolve Employee ID to Email (fallback)
        const { data: dbProfile, error: dbError } = await supabase
          .from('profiles')
          .select('email')
          .eq('employee_id', targetEmail)
          .maybeSingle();

        if (dbError) {
          console.error('Database query error:', dbError);
        }

        if (dbProfile?.email) {
          targetEmail = dbProfile.email;
        } else {
          // If the targetEmail doesn't contain '@', then it's an employee ID that wasn't found.
          if (!targetEmail.includes('@')) {
            setError('No employee account found with this ID.');
            setLoading(false);
            return;
          }
        }
      }

      // Perform strict Supabase Auth sign-in
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password,
      });

      if (authError) {
        setError('Invalid credentials or authentication failed.');
        setLoading(false);
        return;
      }

      // Verify that the logged in user is actually an employee
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user?.id)
        .single();

      if (profileError || !profile) {
        await supabase.auth.signOut();
        setError('Employee profile not found. Please contact your administrator.');
        setLoading(false);
        return;
      }

      if (profile.role !== 'employee') {
        await supabase.auth.signOut();
        setError('Access denied. Please use the Admin Login for administrator accounts.');
        setLoading(false);
        return;
      }

      navigate('/dashboard');
      closeModals();
    } catch (err: any) {
      console.error('Employee login system error:', err);
      setError(err.message || 'An error occurred during employee authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 10); // 10 days trial (to be applied upon manual approval)

      // Check if email already registered to prevent duplicates
      const { data: existingReg, error: checkError } = await supabase
        .from('hr_registrations')
        .select('id')
        .eq('org_email', signupData.orgEmail)
        .maybeSingle();

      if (checkError) throw checkError;
      if (existingReg) {
        throw new Error('This organization email is already registered.');
      }

      // 1. Save to Registrations (for keeping track of offer letters and details)
      const { error: dbError } = await supabase
        .from('hr_registrations')
        .insert([{
          name: signupData.name,
          org_name: signupData.orgName,
          org_email: signupData.orgEmail,
          phone: signupData.phone,
          status: 'pending'
        }]);

      if (dbError) throw dbError;

      // 3. Send real email via Resend
      try {
        await sendEmail({
          to: 'vyarahr2026@gmail.com', // Admin notification
          subject: `New HR Registration: ${signupData.orgName}`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #0f2d52;">New Organizational Registration</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Name:</strong></td><td style="padding: 10px; border-bottom: 1px solid #eee;">${signupData.name}</td></tr>
                <tr><td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Organization:</strong></td><td style="padding: 10px; border-bottom: 1px solid #eee;">${signupData.orgName}</td></tr>
                <tr><td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Email:</strong></td><td style="padding: 10px; border-bottom: 1px solid #eee;">${signupData.orgEmail}</td></tr>
                <tr><td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Phone:</strong></td><td style="padding: 10px; border-bottom: 1px solid #eee;">${signupData.phone}</td></tr>
                <tr><td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Trial Status:</strong></td><td style="padding: 10px; border-bottom: 1px solid #eee;">Pending Approval (Exp: ${expiresAt.toLocaleDateString()})</td></tr>
              </table>
            </div>
          `
        });
      } catch (err) {
        console.error('Email sending failed:', err);
      }
      
      setSuccessMessage('Your registration request has been submitted successfully. Our team will review your offer letter and details. Your free access will be enabled in 5 to 7 days.');
      
      // Reset form
      setSignupData({
        name: '',
        orgName: '',
        orgEmail: '',
        phone: '',
        offerLetter: null
      });
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleBilling = () => {
    setIsAnnual(!isAnnual);
  };

  const prices = {
    starter: isAnnual ? '1,499' : '1,999',
    growth: isAnnual ? '3,749' : '4,999',
    pro: isAnnual ? '7,499' : '9,999',
  };

  return (
    <div className="landing-body">
      {/* ===== NAVBAR ===== */}
      <nav className={`${scrolled ? 'scrolled' : ''} ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <a href="#" className="nav-logo" onClick={() => setIsMobileMenuOpen(false)}>
          <img src="/logo.png" alt="VyaraHR" className="nav-logo-img" />
        </a>

        {/* Desktop Links */}
        <ul className="nav-links">
          <li><a href="#products">Products</a></li>
          <li><a href="#customers">Customers</a></li>
          <li><a href="#pricing">Pricing</a></li>
          <li><a href="#about">About</a></li>
        </ul>

        {/* Desktop CTA */}
        <div className="nav-cta">
          <button className="btn-ghost" onClick={() => openModal('signupModal')}>Sign Up</button>
          <button className="btn-ghost" onClick={() => openModal('selectorModal')}>Log In</button>
          <button className="btn-primary" onClick={() => openModal('signupModal')}>Get Started Free</button>
        </div>

        {/* Mobile Hamburger */}
        <button 
          className={`hamburger ${isMobileMenuOpen ? 'open' : ''}`} 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle Menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

      </nav>
      
      {/* Mobile Slide-down Menu */}
      <div className={`mobile-menu ${isMobileMenuOpen ? 'active' : ''}`}>
        <ul className="mobile-nav-links">
          <li><a href="#products" onClick={() => setIsMobileMenuOpen(false)}>Products</a></li>
          <li><a href="#customers" onClick={() => setIsMobileMenuOpen(false)}>Customers</a></li>
          <li><a href="#pricing" onClick={() => setIsMobileMenuOpen(false)}>Pricing</a></li>
          <li><a href="#about" onClick={() => setIsMobileMenuOpen(false)}>About</a></li>
        </ul>
        <div className="mobile-nav-cta">
          <button className="btn-primary w-full" onClick={() => { setIsMobileMenuOpen(false); openModal('signupModal'); }}>Start Free Trial</button>
          <button className="btn-ghost w-full" onClick={() => { setIsMobileMenuOpen(false); openModal('selectorModal'); }}>Sign In</button>
        </div>
      </div>

      {/* ===== HERO ===== */}
      <section className="hero" id="home">
        <div className="hero-glow"></div>
        <div className="hero-glow2"></div>

        <div className="hero-content">
          <div className="hero-badge">Leading HR Management Solution</div>
          <h1>HR Management<br />Made <span className="highlight">Effortlessly</span><br />Powerful</h1>
          <p>VyaraHR brings hiring, onboarding, payroll, performance, and team management into one seamless platform — built for modern businesses.</p>
          <div className="hero-btns">
            <button className="btn-primary btn-large" onClick={() => openModal('signupModal')}>Start Free Trial</button>
            <button className="btn-outline-large" onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}>Explore Features →</button>
          </div>
          <div className="hero-stats">
            <div className="stat-item"><div className="stat-num">🛡️</div><div className="stat-label">Secure Enterprise Platform</div></div>
            <div className="stat-item"><div className="stat-num">50K+</div><div className="stat-label">Employees managed</div></div>
            <div className="stat-item"><div className="stat-num">99.9%</div><div className="stat-label">Uptime guaranteed</div></div>
          </div>
        </div>

        {/* Dashboard Mockup */}
        <div className="hero-visual">
          <div className="dashboard-mock">
            <div className="mock-topbar">
              <div className="mock-dot r"></div>
              <div className="mock-dot y"></div>
              <div className="mock-dot g"></div>
              <span className="mock-title">VyaraHR — Admin Dashboard</span>
            </div>
            <div className="mock-cards">
              <div className="mock-card">
                <div className="mock-card-label">Total Employees</div>
                <div className="mock-card-val white">142</div>
              </div>
              <div className="mock-card">
                <div className="mock-card-label">Present Today</div>
                <div className="mock-card-val teal">128</div>
              </div>
              <div className="mock-card">
                <div className="mock-card-label">On Leave</div>
                <div className="mock-card-val orange">14</div>
              </div>
            </div>
            <div className="mock-bar-section">
              <div className="mock-bar-title">Department Performance</div>
              <div className="mock-bar-row"><span className="mock-bar-name">Development</span><div className="mock-bar-track"><div className="mock-bar-fill w-88pct"></div></div><span className="mock-bar-pct">88%</span></div>
              <div className="mock-bar-row"><span className="mock-bar-name">Marketing</span><div className="mock-bar-track"><div className="mock-bar-fill orange w-72pct"></div></div><span className="mock-bar-pct">72%</span></div>
              <div className="mock-bar-row"><span className="mock-bar-name">Sales</span><div className="mock-bar-track"><div className="mock-bar-fill w-65pct"></div></div><span className="mock-bar-pct">65%</span></div>
              <div className="mock-bar-row"><span className="mock-bar-name">Testing</span><div className="mock-bar-track"><div className="mock-bar-fill orange w-91pct"></div></div><span className="mock-bar-pct">91%</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PRODUCTS ===== */}
      <section id="products">
        <div className="reveal">
          <div className="section-label">Products</div>
          <h2 className="section-title">Everything your HR team<br />needs, built in</h2>
          <p className="section-sub">From hiring to retirement — VyaraHR covers every touchpoint of your employee lifecycle in one intelligent platform.</p>
        </div>
        <div className="products-grid">
          <div className="product-card reveal">
            <div className="product-name">Smart Dashboard</div>
            <div className="product-desc">Real-time company pulse — attendance, leaves, remote workers, and team status at a single glance.</div>
            <ul className="product-features">
              <li>Live Attendance</li>
              <li>Leave Tracking</li>
              <li>Team Analytics</li>
            </ul>
          </div>
          <div className="product-card reveal">
            <div className="product-name">AI-Powered Hiring</div>
            <div className="product-desc">From job posting to offer letter — our ATS AI shortlists resumes automatically.</div>
            <ul className="product-features">
              <li>ATS Integration</li>
              <li>Resume Parsing</li>
              <li>Auto-Shortlisting</li>
            </ul>
          </div>
          <div className="product-card reveal">
            <div className="product-name">Onboarding & Offboarding</div>
            <div className="product-desc">Create employee IDs, generate offer letters, and manage smooth exits.</div>
            <ul className="product-features">
              <li>Digital Offer Letters</li>
              <li>Asset Tracking</li>
              <li>Exit Management</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ===== CUSTOMERS ===== */}
      <section id="customers">
        <div className="customers-header reveal">
          <div className="section-label">Customers</div>
          <h2 className="section-title">Fueling the world's most<br />ambitious Companies</h2>
        </div>
        <div className="logos-strip reveal">
          <div className="logos-track">
            {['ZOMATO', 'SWIGGY', 'RAZORPAY', 'DUNZO', 'CRED', 'FLIPKART', 'ZOMATO', 'SWIGGY', 'RAZORPAY', 'DUNZO'].map((logo, i) => (
              <div key={i} className="logo-item">{logo}</div>
            ))}
          </div>
        </div>
        <div className="testimonials-grid">
          {[
            { name: 'Arjun Reddy', role: 'CEO at TechNova', text: 'VyaraHR completely transformed how we manage our 200+ employees. The AI hiring tool saved us hundreds of hours.' },
            { name: 'Priya Sharma', role: 'HR Director at GlobalSync', text: 'The most intuitive HR platform I have ever used. Our employees love the self-service mobile portal!' },
            { name: 'Vikram Singh', role: 'Founder at GrowthScale', text: 'Clean, fast, and powerful. VyaraHR is exactly what any modern startup needs to scale their team.' }
          ].map((t, i) => (
            <div key={i} className="testimonial-card reveal">
              <div className="stars">★★★★★</div>
              <p className="testimonial-text">"{t.text}"</p>
              <div className="testimonial-author">
                <div className={`author-avatar testimonial-bg-${i}`}>{t.name[0]}</div>
                <div>
                  <div className="author-name">{t.name}</div>
                  <div className="author-role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section id="pricing">
        <div className="pricing-header reveal">
          <div className="section-label">Pricing</div>
          <h2 className="section-title">Simple scaling, no surprises</h2>
          <div className="pricing-toggle">
            <span>Billed Monthly</span>
            <div className={`toggle-switch ${isAnnual ? 'active' : ''}`} onClick={toggleBilling}>
              <div className="toggle-knob"></div>
            </div>
            <span>Billed Annually</span>
            <div className="save-badge">Save 25%</div>
          </div>
        </div>
        <div className="pricing-grid">
          <div className="pricing-card reveal">
            <div className="plan-name">Starter</div>
            <div className="plan-price"><sup>₹</sup>{prices.starter}<span>/mo</span></div>
            <p className="plan-desc">For small teams just getting started with digitized HR.</p>
            <hr className="plan-divider" />
            <ul className="plan-features">
              <li><span className="check">✓</span> Up to 25 Employees</li>
              <li><span className="check">✓</span> Core Dashboard</li>
              <li><span className="check">✓</span> Attendance & Leaves</li>
              <li><span className="cross">✕</span> AI Auto-shortlisting</li>
            </ul>
            <button className="plan-btn outline" onClick={() => openModal('signupModal')}>Get Started</button>
          </div>
          <div className="pricing-card popular reveal">
            <div className="popular-badge">MOST POPULAR</div>
            <div className="plan-name">Growth</div>
            <div className="plan-price"><sup>₹</sup>{prices.growth}<span>/mo</span></div>
            <p className="plan-desc">Everything you need to manage a scaling organization.</p>
            <hr className="plan-divider" />
            <ul className="plan-features">
              <li><span className="check">✓</span> Up to 100 Employees</li>
              <li><span className="check">✓</span> AI Hiring Module</li>
              <li><span className="check">✓</span> Payroll Integration</li>
              <li><span className="check">✓</span> Goal Tracking</li>
            </ul>
            <button className="plan-btn filled" onClick={() => openModal('signupModal')}>Start Free Trial</button>
          </div>
          <div className="pricing-card reveal">
            <div className="plan-name">Pro</div>
            <div className="plan-price"><sup>₹</sup>{prices.pro}<span>/mo</span></div>
            <p className="plan-desc">Advanced controls for large-scale enterprise operations.</p>
            <hr className="plan-divider" />
            <ul className="plan-features">
              <li><span className="check">✓</span> Unlimited Employees</li>
              <li><span className="check">✓</span> Custom Workflows</li>
              <li><span className="check">✓</span> Priority 24/7 Support</li>
              <li><span className="check">✓</span> Audit Logs</li>
            </ul>
            <button className="plan-btn outline" onClick={() => openModal('signupModal')}>Contact Sales</button>
          </div>
        </div>
      </section>

      {/* ===== ABOUT ===== */}
      <section id="about">
        <div className="reveal">
          <div className="section-label">About Us</div>
          <h2 className="section-title">Human-first design for<br />modern workforce</h2>
          <p className="section-sub">At VyaraHR, we believe HR should be a catalyst for growth, not a source of paperwork. Our mission is to automate the mundane so you can focus on your most valuable asset: your people.</p>
          <div className="about-values">
            <div className="value-card">
              <div className="value-icon">⚡</div>
              <div className="value-name">Speed</div>
              <div className="value-desc">Fastest implementation in the industry.</div>
            </div>
            <div className="value-card">
              <div className="value-icon">🛡️</div>
              <div className="value-name">Security</div>
              <div className="value-desc">Enterprise-grade data protection.</div>
            </div>
          </div>
        </div>
        <div className="about-visual reveal">
          <div className="about-card-main">
            <div className="about-team-grid">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="team-member">
                  <div className={`team-avatar ${i % 2 === 0 ? 'team-bg-even' : 'team-bg-odd'}`}>{String.fromCharCode(64 + i)}</div>
                  <div className="team-name">Member {i}</div>
                </div>
              ))}
            </div>
            <div className="about-metrics">
              <div className="about-metric"><div className="about-metric-num">15m+</div><div className="about-metric-label">Hours Saved</div></div>
              <div className="about-metric"><div className="about-metric-num">98%</div><div className="about-metric-label">CSAT Score</div></div>
              <div className="about-metric"><div className="about-metric-num">24/7</div><div className="about-metric-label">Support</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="cta-section reveal">
        <h2 className="cta-title">Ready to transform<br />your workplace?</h2>
        <p className="cta-sub">Join forward-thinking companies already using VyaraHR to build better teams.</p>
        <div className="cta-btns">
          <button className="btn-primary btn-large" onClick={() => openModal('signupModal')}>Create Free Account</button>
          <button className="btn-outline-large" onClick={() => openModal('signupModal')}>Book a Demo</button>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer>
        <div className="footer-grid">
          <div className="footer-brand">
            <a href="#" className="nav-logo">Vyara<span>HR</span></a>
            <p className="footer-tagline">Modern HR management for growing businesses. Built in Coimbatore, Tamil Nadu.</p>
            <div className="footer-socials">
              <button className="social-btn">in</button>
              <button className="social-btn">tw</button>
              <button className="social-btn">fb</button>
            </div>
          </div>
          <div className="footer-col">
            <h4>Products</h4>
            <ul>
              <li><a href="#products">Dashboard</a></li>
              <li><a href="#products">AI Hiring</a></li>
              <li><a href="#products">Payroll</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Resources</h4>
            <ul>
              <li><a href="#">Guides</a></li>
              <li><a href="#">Security</a></li>
              <li><a href="#">Help Center</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Contact</h4>
            <ul>
              <li><a href="#">Sales</a></li>
              <li><a href="#">Support</a></li>
              <li><a href="#">Partners</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2025 VyaraHR. All rights reserved. Made in Coimbatore 🇮🇳</span>
          <span>Terms · Privacy · Cookies</span>
        </div>
      </footer>

      {/* ===== LOGIN SELECTOR MODAL ===== */}
      <div className={`modal-overlay ${activeModal === 'selectorModal' ? 'open' : ''}`} onClick={(e) => e.target === e.currentTarget && closeModals()}>
        <div className="modal">
          <button className="modal-close" onClick={closeModals}>✕</button>
          <div className="modal-logo">
            <img src="/logo.png" alt="VyaraHR" />
          </div>
          <h2 className="modal-welcome-title">Welcome Back</h2>
          <p className="modal-subtitle">Select your account type to continue</p>
          <div className="login-selector">
            <div className="login-option" onClick={() => openModal('adminModal')}>
              <div className="opt-label">Admin</div>
              <div className="opt-sub">Company administrator access</div>
            </div>
            <div className="login-option" onClick={() => openModal('employeeModal')}>
              <div className="opt-label">Employee</div>
              <div className="opt-sub">Personal employee portal</div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== ADMIN LOGIN MODAL ===== */}
      <div className={`modal-overlay ${activeModal === 'adminModal' ? 'open' : ''}`} onClick={(e) => e.target === e.currentTarget && closeModals()}>
        <div className="modal">
          <button className="modal-close" onClick={closeModals}>✕</button>
          <div className="modal-logo">
            <img src="/logo.png" alt="VyaraHR" />
          </div>
          <div className="modal-role-badge admin">Admin Login</div>
          <h2>Admin Portal</h2>
          <p className="modal-subtitle">Sign in with your administrator credentials</p>
          
          <form onSubmit={handleAdminLogin}>
            {error && <div className="error-message error-msg-admin">{error}</div>}
            <div className="form-group">
              <label className="form-label">Company Email</label>
              <input 
                type="email" 
                className="form-input" 
                placeholder="admin@yourcompany.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="Enter your password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button className="modal-btn accent" type="submit" disabled={loading}>
              {loading ? 'Authenticating...' : 'Sign In as Admin →'}
            </button>
          </form>
          
          <div className="modal-switch mt-20">Not an admin? <a href="#" onClick={() => openModal('employeeModal')}>Login as Employee</a></div>
          <div className="modal-switch mt-10"><a href="#" onClick={() => openModal('selectorModal')}>← Back</a></div>
        </div>
      </div>

      {/* ===== EMPLOYEE LOGIN MODAL ===== */}
      <div className={`modal-overlay ${activeModal === 'employeeModal' ? 'open' : ''}`} onClick={(e) => e.target === e.currentTarget && closeModals()}>
        <div className="modal">
          <button className="modal-close" onClick={closeModals}>✕</button>
          <div className="modal-logo">
            <img src="/logo.png" alt="VyaraHR" />
          </div>
          <div className="modal-role-badge employee">Employee Login</div>
          <h2>Employee Portal</h2>
          <p className="modal-subtitle">Sign in using your company email/ID and password</p>
          
          <form onSubmit={handleEmployeeLogin}>
            {error && <div className="error-message error-msg-employee">{error}</div>}
            <div className="form-group">
              <label className="form-label">Work Email / Employee ID</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. john.doe@company.com or VYR-..." 
                value={employeeEmail}
                onChange={(e) => setEmployeeEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="Enter your password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <button className="modal-btn" type="submit" disabled={loading}>
              {loading ? 'Authenticating...' : 'Sign In as Employee →'}
            </button>
          </form>

          <div className="modal-switch mt-20">Are you an admin? <a href="#" onClick={() => openModal('adminModal')}>Login as Admin</a></div>
          <div className="modal-switch mt-10"><a href="#" onClick={() => openModal('selectorModal')}>← Back</a></div>
        </div>
      </div>

      {/* ===== SIGNUP MODAL (HR REGISTRATION) ===== */}
      <div className={`modal-overlay ${activeModal === 'signupModal' ? 'open' : ''}`} onClick={(e) => e.target === e.currentTarget && closeModals()}>
        <div className="modal modal-lg">
          <button className="modal-close" onClick={closeModals}>✕</button>
          <div className="modal-logo">
            <img src="/logo.png" alt="VyaraHR" />
          </div>
          
          {successMessage ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-emerald-100/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Registration Received!</h2>
              <p className="text-gray-400 leading-relaxed mb-8">
                {successMessage}
              </p>
              <button className="modal-btn" onClick={() => { closeModals(); setSuccessMessage(null); }}>
                Done
              </button>
            </div>
          ) : (
            <>
              <div className="modal-role-badge admin">HR Signup</div>
              <h2>Create Admin Account</h2>
              <p className="modal-subtitle">Register your organization to start your free trial</p>
              
              <form onSubmit={handleSignupSubmit}>
                <div className="grid-2col">
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Your Name" 
                      required
                      value={signupData.name}
                      onChange={(e) => setSignupData({...signupData, name: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input 
                      type="tel" 
                      className="form-input" 
                      placeholder="+91 00000 00000" 
                      required
                      value={signupData.phone}
                      onChange={(e) => setSignupData({...signupData, phone: e.target.value})}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Organization Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Company Pvt Ltd" 
                    required
                    value={signupData.orgName}
                    onChange={(e) => setSignupData({...signupData, orgName: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Organization Email (Admin)</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    placeholder="hr@company.com" 
                    required
                    autoComplete="off"
                    value={signupData.orgEmail}
                    onChange={(e) => setSignupData({...signupData, orgEmail: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Offer Letter (Verification as HR)</label>
                  <div className="relative-container">
                    <input 
                      type="file" 
                      className="file-input-hidden"
                      title="Upload Offer Letter"
                      aria-label="Upload Offer Letter"
                      placeholder="Upload Offer Letter"
                      accept=".pdf,.jpg,.jpeg,.png"
                      required
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setSignupData({...signupData, offerLetter: e.target.files[0]});
                        }
                      }}
                    />
                    <div className="form-input file-input-display">
                      <span className={`file-name-text ${signupData.offerLetter ? 'has-file' : 'no-file'}`}>
                        {signupData.offerLetter ? signupData.offerLetter.name : 'Upload Offer Letter (PDF/Img)'}
                      </span>
                      <span className="file-icon">📁</span>
                    </div>
                  </div>
                </div>


                <button className="modal-btn mt-20" type="submit" disabled={loading}>
                  {loading ? 'Submitting...' : 'Register as Admin →'}
                </button>
              </form>

              <div className="modal-switch mt-20">
                Already have an account? <a href="#" onClick={() => openModal('selectorModal')}>Login</a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
