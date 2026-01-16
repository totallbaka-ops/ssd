// src/components/Header.jsx
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Map, Shield, LayoutDashboard, LogIn, LogOut, Menu, Lock, Phone, Mail } from "lucide-react";

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("civic_user") || "null");
  const [lang, setLang] = useState("en"); // 'en' or 'te'

  const isActive = (path) => location.pathname === path;

  const onLogout = () => {
    localStorage.removeItem("civic_user");
    localStorage.removeItem("civic_token");
    navigate("/");
  };

  // Simple Translation Dictionary
  const t = {
    en: {
      skip: "Skip to Main Content",
      screenReader: "Screen Reader Access",
      title1: "Greater Hyderabad",
      title2: "Municipal Corporation",
      helpline: "Helpline",
      email: "Email Us",
      home: "Home",
      admin: "Admin Console",
      grievance: "Grievance Redressal",
      myGrievances: "My Grievances",
      login: "Citizen Login",
      official: "Official Login",
      logout: "Logout"
    },
    te: {
      skip: "ప్రధాన కంటెంట్‌కి వెళ్లండి",
      screenReader: "స్క్రీన్ రీడర్ యాక్సెస్",
      title1: "గ్రేటర్ హైదరాబాద్",
      title2: "మున్సిపల్ కార్పొరేషన్",
      helpline: "హెల్ప్‌లైన్",
      email: "మాకు ఇమెయిల్ చేయండి",
      home: "హోమ్",
      admin: "అడ్మిన్ కన్సోల్",
      grievance: "ఫిర్యాదు పరిష్కారం",
      myGrievances: "నా ఫిర్యాదులు",
      login: "పౌర లాగిన్",
      official: "అధికారిక లాగిన్",
      logout: "లాగ్ అవుట్"
    }
  };

  const NavLink = ({ to, icon: Icon, label }) => (
    <Link
      to={to}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors duration-200 border-b-4 ${isActive(to)
          ? "border-[#F5BC5B] text-white bg-[#1e2060]"
          : "border-transparent text-white hover:bg-[#1e2060] hover:border-[#5FB6EA]"
        }`}
    >
      {Icon && <Icon size={16} />}
      {label}
    </Link>
  );

  return (
    <header className="flex flex-col w-full shadow-md font-sans">
      {/* 1. Top Utility Bar - SIMPLIFIED */}
      <div className="bg-[#f8f9fa] border-b border-gray-200 py-1 px-4 text-xs text-gray-600 hidden md:flex justify-end items-center">
        <div className="flex gap-2">
          <span
            className={`cursor-pointer font-bold ${lang === 'en' ? 'text-[#2D3092]' : 'text-gray-500 hover:text-[#2D3092]'}`}
            onClick={() => setLang('en')}
          >
            English
          </span>
          <span className="text-gray-400">|</span>
          <span
            className={`cursor-pointer font-bold ${lang === 'te' ? 'text-[#2D3092]' : 'text-gray-500 hover:text-[#2D3092]'}`}
            onClick={() => setLang('te')}
          >
            Telugu
          </span>
        </div>
      </div>

      {/* 2. Branding Section */}
      <div className="bg-white py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-4 group">
          {/* Telangana Government Logo */}
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Government_of_Telangana_Logo.png/600px-Government_of_Telangana_Logo.png"
            alt="Telangana Government Logo"
            className="h-20 w-auto object-contain"
            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
          />
          <div className="hidden bg-green-100 text-[#2D3092] p-3 rounded-full items-center justify-center">
            <Shield size={32} />
          </div>

          <div className="flex flex-col">
            <span className="text-2xl font-bold text-[#2D3092] uppercase tracking-wide leading-none">
              {t[lang].title1}
            </span>
            <span className="text-lg font-semibold text-[#5FB6EA] uppercase tracking-wider leading-tight">
              {t[lang].title2}
            </span>
          </div>
        </Link>

        {/* Right Side: Emergency/Contact */}
        <div className="hidden lg:flex items-center gap-6">
          <div className="flex items-center gap-3 text-right">
            <div className="p-2 bg-green-50 rounded-full text-[#8AC53E]">
              <Phone size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">{t[lang].helpline}</p>
              <p className="text-lg font-bold text-gray-800">040-21111111</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-right border-l border-gray-200 pl-6">
            <div className="p-2 bg-blue-50 rounded-full text-[#2D3092]">
              <Mail size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">{t[lang].email}</p>
              <p className="text-sm font-bold text-gray-800">commissioner@ghmc.gov.in</p>
            </div>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button className="md:hidden p-2 text-[#2D3092] hover:bg-blue-50 rounded-lg">
          <Menu size={28} />
        </button>
      </div>

      {/* 3. Main Navigation Bar */}
      <div className="bg-[#2D3092] text-white shadow-lg hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <nav className="flex items-center">
              <NavLink to="/" icon={Map} label={t[lang].home} />

              {user ? (
                // LOGGED IN
                user.role === 'admin' ? (
                  <NavLink to="/admin" icon={LayoutDashboard} label={t[lang].admin} />
                ) : (
                  <>
                    <NavLink to="/submit" icon={Shield} label={t[lang].grievance} />
                    <NavLink to="/dashboard" icon={LayoutDashboard} label={t[lang].myGrievances} />
                  </>
                )
              ) : (
                // LOGGED OUT
                <>
                  <NavLink to="/login" icon={LogIn} label={t[lang].login} />
                  <Link
                    to="/admin/login"
                    className="flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-4 border-transparent text-gray-300 hover:text-white hover:bg-[#1e2060] transition-colors"
                  >
                    <Lock size={16} /> {t[lang].official}
                  </Link>
                </>
              )}
            </nav>

            {/* User Profile in Nav */}
            {user && (
              <div className="flex items-center gap-4 pl-4">
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">{user.name || "User"}</p>
                  <p className="text-xs text-[#5FB6EA] capitalize">{user.role || "Citizen"}</p>
                </div>
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1 text-xs bg-[#EC6C6C] hover:bg-red-600 text-white px-3 py-1.5 rounded shadow-sm transition-colors"
                >
                  <LogOut size={14} /> {t[lang].logout}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}