"use client";

import Link from "next/link";

export function DesktopHeader() {
  return (
    <div>
      <header className="absolute m-8 inset-3 top-0 z-1 px-6 sm:px-10 py-0 flex items-center justify-between bg-transparent h-20">
        <div className="inline-flex items-center gap-4 group">
          <img
            src="/images/main-banner-2.png"
            alt="USSC-Connect"
            className="ml-5 h-20 w-auto  object-contain"
          />
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-regular text-[#2E7D32]">
          {/* <Link
            href="/"
            className="hover:text-[#2E7D32] transition-colors uppercase"
          >
            Home
          </Link>

          <Link
            href="/about"
            className="hover:text-[#2E7D32] transition-colors uppercase"
          >
            About
          </Link>

          <Link
            href="/contact"
            className="hover:text-[#2E7D32] transition-colors uppercase"
          >
            Contact
          </Link> */}

          {/* <Link
            href="/login"
            className="px-4 py-2 rounded-lg bg-linear-to-r from-[#8BC34A] to-[#2E7D32] text-white hover:bg-[#2E7D32] transition-colors uppercase"
          >
            Login
          </Link> */}

          <Link
            href="/payment"
            className="px-4 py-2 rounded-lg bg-linear-to-r from-[#8BC34A] to-[#2E7D32] text-white hover:bg-[#2E7D32] transition-colors uppercase font-semibold"
          >
            Payment
          </Link>
        </nav>
      </header>
    </div>
  );
}