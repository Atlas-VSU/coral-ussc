"use client";

import Link from "next/link";
import { Users, GraduationCap, ArrowRight } from "lucide-react";

export default function LoginCard() {
  return (
    <div className="relative w-full max-w-sm z-10 animate-fade-in-up mx-auto my-auto">
      <div
        className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden z-0"
        style={{
          backgroundImage: "url('/searchfortruth-2.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* Main frosted card */}
      <div
        className="relative z-10 w-full rounded-2xl px-8 py-10 flex flex-col items-center gap-6"
        style={{
          background: "rgba(255, 255, 255, 0.75)",
          backdropFilter: "blur(16px) saturate(180%)",
          WebkitBackdropFilter: "blur(16px) saturate(180%)",
          boxShadow: "0 8px 40px rgba(27, 94, 32, 0.15), 0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        {/* Logo */}
        <img
          src="/images/ussc-logo-1.webp"
          alt="USSC Connect"
          className="w-20 h-20 object-contain"
        />

        {/* Title */}
        <div className="text-center">
          <h2 className="text-3xl font-black text-[#1F7700]">USSC Connect</h2>
          <p className="text-sm font-semibold text-[#1F7700] mt-1 leading-relaxed">
            Welcome! Please select your portal to sign in and access your dashboard.
          </p>
        </div>

        {/* Portal selector tabs */}
        <div className="grid grid-cols-2 gap-3 w-full">
          <div className="flex flex-col items-center gap-2 py-4 px-3 rounded-xl bg-white border border-gray-100 shadow-sm">
            <Users className="size-5 text-gray-500" />
            <p className="text-xs text-gray-600 font-medium">Admin Portal</p>
          </div>
          <div className="flex flex-col items-center gap-2 py-4 px-3 rounded-xl bg-white border border-gray-100 shadow-sm">
            <GraduationCap className="size-5 text-gray-500" />
            <p className="text-xs text-gray-600 font-medium">Student Portal</p>
          </div>
        </div>

        {/* Sign in buttons */}
        <div className="flex flex-col gap-3 w-full">
          <Link href="/admin-dashboard" className="block group">
            <button
              className="w-full h-14 flex items-center gap-4 px-5 rounded-xl text-white font-semibold text-sm transition-all duration-200 hover:brightness-110"
              style={{ backgroundColor: "#269000" }}
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/20">
                <Users className="size-4" />
              </div>
              <span className="flex-1 text-left">Sign in as Admin</span>
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </button>
          </Link>

          <Link href="/portal-dashboard" className="block group">
            <button
              className="w-full h-14 flex items-center gap-4 px-5 rounded-xl font-semibold text-sm border-2 transition-all duration-200 bg-white hover:bg-gray-50"
              style={{ borderColor: "#8BC34A", color: "#2E7D32" }}
            >
              <div
                className="flex items-center justify-center w-8 h-8 rounded-lg"
                style={{ backgroundColor: "#8BC34A22" }}
              >
                <GraduationCap className="size-4" />
              </div>
              <span className="flex-1 text-left">Sign in as Student</span>
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </button>
          </Link>
        </div>

        {/* Footer */}
        <p className="text-xs text-gray-400 pt-2">Powered by VERIS.</p>
      </div>
    </div>
  );
}