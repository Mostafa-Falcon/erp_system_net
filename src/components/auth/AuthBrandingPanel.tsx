import React from 'react';

interface AuthBrandingPanelProps {
  mode?: 'login' | 'register';
}

export const AuthBrandingPanel: React.FC<AuthBrandingPanelProps> = ({ mode = 'login' }) => {
  return (
    <div className="relative hidden lg:flex flex-col items-center justify-between w-full h-full p-8 xl:p-12 overflow-hidden bg-gradient-to-b from-[#0c2e1c] via-[#092316] to-[#04150d] text-white select-none">
      {/* Background ambient lighting */}
      <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-[#16a34a] opacity-15 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-[#22c55e] opacity-10 blur-[140px] pointer-events-none" />

      {/* Top spacer */}
      <div className="w-full" />

      {/* Center Branding Block */}
      <div className="flex flex-col items-center text-center max-w-md z-10 my-auto">
        {/* Emblem circular badge */}
        <div className="relative mb-6 flex items-center justify-center">
          <div className="w-32 h-32 rounded-full bg-[#123924] border-[5px] border-[#1e4e32] shadow-2xl flex items-center justify-center p-3">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-[#6bc639] via-[#3aa639] to-[#168138] flex items-center justify-center shadow-inner">
              {/* Stylized Ledger Notebook Icon with Dollar Sign */}
              <div className="relative w-12 h-14 bg-white rounded-md shadow-md flex items-center justify-center pl-2">
                {/* Spiral binder holes */}
                <div className="absolute left-1 top-2 flex flex-col gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1b5e20]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1b5e20]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1b5e20]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1b5e20]" />
                </div>
                {/* Dollar sign */}
                <span className="text-[#1b5e20] font-black text-xl select-none leading-none mr-1">
                  $
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Heading */}
        <h1 className="text-3xl xl:text-4xl font-black tracking-tight text-white mb-2">
          منظومة الإدارة الشاملة
        </h1>
        <p className="text-sm font-semibold text-emerald-200/80 mb-8">
          نظام الإدارة والمحاسبة المتكامل
        </p>

        {/* Glassmorphism Feature Card */}
        <div className="w-full rounded-2xl bg-[#09291a]/70 border border-emerald-500/25 backdrop-blur-md p-6 shadow-2xl">
          <div className="mx-auto w-10 h-10 rounded-xl bg-emerald-900/70 border border-emerald-500/30 flex items-center justify-center mb-3 text-emerald-300">
            {mode === 'register' ? (
              /* User Plus Icon for Register */
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
            ) : (
              /* Ledger / System Icon for Login */
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <line x1="8" y1="9" x2="16" y2="9" />
                <line x1="8" y1="13" x2="16" y2="13" />
                <line x1="8" y1="17" x2="12" y2="17" />
              </svg>
            )}
          </div>
          <h3 className="text-base font-bold text-white mb-2">
            نظام الإدارة والمحاسبة المتطور
          </h3>
          <p className="text-xs text-emerald-100/75 leading-relaxed font-medium">
            الجيل القادم من حلول إدارة العمليات والمحاسبة. صمم خصيصاً ليناسب احتياجاتك.
          </p>
        </div>
      </div>

      {/* Bottom Feature Badges */}
      <div className="flex items-center justify-center gap-5 text-xs font-semibold text-emerald-200/80 z-10 pt-4">
        <span className="flex items-center gap-1.5">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          تشفير Enterprise
        </span>
        <span>•</span>
        <span className="flex items-center gap-1.5">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          أداء فائق
        </span>
        <span>•</span>
        <span className="flex items-center gap-1.5">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
          </svg>
          هجين (سحابي/محلي)
        </span>
      </div>
    </div>
  );
};
