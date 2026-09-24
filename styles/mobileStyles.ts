// styles/mobileStyles.ts

export const mobileStyles = `
  /* ──────────────────────────────────────────────────────────
     GLOBAL STYLES (applied on all screen sizes)
     ────────────────────────────────────────────────────────── */

  /* Hamburger / Mobile Nav */
  .mobile-nav-overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.45);
    z-index: 40;
  }
  .mobile-nav-drawer {
    position: fixed;
    top: 0;
    right: 0;
    height: 100%;
    width: min(300px, 85vw);
    background: #fff;
    z-index: 50;
    transform: translateX(100%);
    transition: transform 0.3s cubic-bezier(.4,0,.2,1);
    display: flex;
    flex-direction: column;
    padding: 0;
    box-shadow: -4px 0 24px rgba(0,0,0,0.12);
    overflow-y: auto;
  }
  .mobile-nav-drawer.open {
    transform: translateX(0);
  }
  .mobile-nav-overlay.open {
    display: block;
  }

  /* Testimonials Carousel */
  .testimonials-carousel-track {
    display: flex;
    gap: 16px;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    padding-bottom: 4px;
  }
  .testimonials-carousel-track::-webkit-scrollbar { display: none; }
  .testimonial-slide {
    flex: 0 0 calc(100% - 32px);
    scroll-snap-align: center;
  }

  /* FAQ horizontal tab scroll */
  .faq-tab-scroll {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 4px;
  }
  .faq-tab-scroll::-webkit-scrollbar { display: none; }

  /* FAQ accordion smooth animation */
  .faq-answer {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.35s cubic-bezier(.4,0,.2,1), opacity 0.3s ease;
    opacity: 0;
  }
  .faq-answer.open {
    max-height: 600px;
    opacity: 1;
  }

  /* Footer accordion */
  .footer-links-mobile {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.3s cubic-bezier(.4,0,.2,1), opacity 0.25s ease;
    opacity: 0;
  }
  .footer-links-mobile.open {
    max-height: 300px;
    opacity: 1;
  }

  /* ──────────────────────────────────────────────────────────
     MOBILE (max-width: 767px)
     ────────────────────────────────────────────────────────── */
  @media (max-width: 767px) {
    /* ─── Header ─── */
    .desktop-nav { display: none !important; }
    .desktop-auth-buttons { display: none !important; }
    .hamburger-btn { display: flex !important; }

    /* ─── Features ─── */
    .features-grid {
      grid-template-columns: 1fr !important;
      gap: 16px !important;
    }
    .features-grid > div {
      padding: 20px !important;
    }
    .features-grid .group h3 {
      font-size: 1.5rem !important;
      font-weight: 700 !important;
    }
    .features-grid .group p {
      font-size: 1rem !important;
      line-height: 1.625 !important;
    }

    /* ─── Comparison ─── */
    .comparison-grid {
      grid-template-columns: 1fr !important;
      gap: 16px !important;
    }

    /* ─── Techniques ─── */
    .techniques-grid {
      grid-template-columns: 1fr !important;
      gap: 12px !important;
    }
    .techniques-grid > div h3 {
      font-size: 1.25rem !important;
      font-weight: 700 !important;
    }
    .techniques-grid > div p {
      font-size: 1rem !important;
      line-height: 1.625 !important;
    }

    /* ─── Testimonials ─── */
    .testimonials-grid {
      display: none !important;
    }
    .testimonials-mobile {
      display: block !important;
    }

    /* ─── Scanner ─── */
    .scanner-result-grid {
      grid-template-columns: 1fr !important;
    }
    .scanner-summary-grid {
      grid-template-columns: 1fr !important;
    }
    .scanner-result {
      padding: 1rem !important;
      gap: 1rem !important;
    }
    .scanner-result .scanner-summary-grid {
      gap: 0.75rem !important;
    }
    .scanner-result .scanner-summary-grid > div {
      padding: 0.75rem !important;
    }
    .scanner-result .scanner-summary-grid h4 {
      font-size: 0.9rem !important;
    }
    .scanner-result .scanner-summary-grid p,
    .scanner-result .scanner-summary-grid li {
      font-size: 0.85rem !important;
    }
    .scanner-result .scanner-result-grid .p-4.rounded-xl {
      padding: 0.5rem !important;
    }
    .scanner-result .scanner-result-grid .text-lg {
      font-size: 0.9rem !important;
    }
    .scanner-result .scanner-result-grid .text-sm {
      font-size: 0.8rem !important;
    }
    .scanner-result .scanner-result-grid .flex.gap-3.p-3 {
      padding: 0.4rem !important;
      gap: 0.4rem !important;
    }
    .scanner-result .scanner-result-grid .flex.gap-3.p-3 .h-10.w-10 {
      width: 2rem !important;
      height: 2rem !important;
    }
    .scanner-result .scanner-result-grid .flex.gap-3.p-3 .font-semibold {
      font-size: 0.8rem !important;
    }
    .scanner-result .scanner-result-grid .flex.gap-3.p-3 .text-xs {
      font-size: 0.7rem !important;
    }
    .scanner-result .bg-slate-50.rounded-2xl.p-6 {
      padding: 0.75rem !important;
    }
    .scanner-result .bg-slate-50.rounded-2xl.p-6 .font-mono {
      font-size: 0.8rem !important;
    }
    .scanner-result .scanner-actions {
      gap: 0.9rem !important;
      flex-wrap: wrap !important;
    }
    .scanner-result .scanner-actions button {
      padding: 0.25rem 0.5rem !important;
      font-size: 0.75rem !important;
    }
    .scanner-result .text-sm.text-slate-500 {
      font-size: 0.7rem !important;
    }

    /* ─── FAQ ─── */
    .faq-desktop-layout { display: none !important; }
    .faq-mobile-layout { display: flex !important; }

    /* ─── Footer ─── */
    .footer-desktop-grid { display: none !important; }
    .footer-mobile-accordion { display: block !important; }

    /* ─── General spacing ─── */
    .mobile-px { padding-left: 16px !important; padding-right: 16px !important; }
    .mobile-py { padding-top: 48px !important; padding-bottom: 48px !important; }

    /* ─── Touch-friendly buttons ─── */
    button, a[role="button"] { min-height: 44px; }

    /* ─── Prevent overflow ─── */
    body { overflow-x: hidden; }
    * { max-width: 100%; box-sizing: border-box; }
    img { max-width: 100%; height: auto; }

    /* ─── Hero text ─── */
    .hero-title {
      font-size: 1.75rem !important;   /* was 2rem – reduced */
      line-height: 1.2 !important;
    }
    .hero-subtitle {
      font-size: 1rem !important;
    }

    /* ─── FAQ heading ─── */
    .faq-heading {
      font-size: 1.25rem !important;   /* was 1.5rem (text-2xl) – reduced */
      line-height: 1.2 !important;
    }

    /* ─── Scanner pills & actions ─── */
    .scanner-pills { flex-wrap: wrap; gap: 8px; }
    .scanner-actions { flex-wrap: wrap; gap: 8px; }

    /* ─── Result score ─── */
    .result-score { font-size: 4rem !important; }

    /* ─── Section headings ─── */
    .mobile-section-h2 {
      font-size: 1.875rem !important;
      line-height: 1.25 !important;
      font-weight: 700 !important;
    }
    .mobile-section-h1 {
      font-size: 1.5rem !important;
      line-height: 1.25 !important;
      font-weight: 700 !important;
    }
    .mobile-section-p {
      font-size: 1.25rem !important;
      font-weight: 400 !important;
      line-height: 1.625 !important;
    }

    /* ─── CTA icon ─── */
    .cta-shield-icon { display: flex !important; }

    /* ─── Testimonial dots ─── */
    .testimonials-dot-row { touch-action: pan-x; }
  }

  /* ──────────────────────────────────────────────────────────
     DESKTOP (min-width: 768px) – restore hidden elements
     ────────────────────────────────────────────────────────── */
  @media (min-width: 768px) {
    .hamburger-btn { display: none !important; }
    .mobile-nav-overlay { display: none !important; }
    .mobile-nav-drawer { display: none !important; }
    .testimonials-mobile { display: none !important; }
    .faq-desktop-layout { display: flex !important; }
    .faq-mobile-layout { display: none !important; }
    .footer-desktop-grid { display: grid !important; }
    .footer-mobile-accordion { display: none !important; }
  }
`;