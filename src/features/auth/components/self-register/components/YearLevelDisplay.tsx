/** Read-only year level indicator (freshmen only). */
export function YearLevelDisplay() {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-[#1B5E20]">
        Year Level
      </p>
      <div className="flex h-9 items-center rounded-md border !border-[#2E7D32]/30 bg-[#8BC34A]/5 px-3 text-sm text-black">
        1st Year{" "}
        <span className="ml-1 text-[#2E7D32]/70">(Freshman)</span>
      </div>
    </div>
  );
}
