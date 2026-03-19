import Link from "next/link";

export function MobileHeader() {
  return (
    <div>
      <header className="absolute inset-5 m-2 top-0 z-30 px-1 sm:px-6 py-0 flex items-center justify-between bg-white h-16">
        <img
          src="/images/main-banner-2.png"
          alt="USSC-Connect"
          className="h-12 w-auto object-contain"
        />
        {/* <Link
          href="/login"
          className="px-3 py-1.5 rounded-lg bg-linear-to-r from-[#8BC34A] to-[#2E7D32] text-white hover:bg-[#2E7D32] text-xs font-semibold transition-colors uppercase"
        >
          Login
        </Link> */}

        {/* <Link
          href="/payment"
          className="px-3 py-1.5 rounded-lg bg-linear-to-r from-[#8BC34A] to-[#2E7D32] text-white hover:bg-[#2E7D32] text-xs font-semibold transition-colors uppercase"
        >
          Payment
        </Link> */}
      </header>
    </div>
  );
}