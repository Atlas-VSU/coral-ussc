interface ResponsiveProgramTextProps {
  fullName: string;
  shortName?: string | null;
  acronym?: string | null;
}

const deriveAcronym = (value: string) => {
  const parts = value
    .split(/\s+/)
    .map((part) => part.replace(/[^A-Za-z0-9]/g, ""))
    .filter(Boolean);

  if (parts.length === 0) return value;

  const stopWords = new Set(["of", "in", "and", "the", "for", "to", "a", "an"]);
  const initials = parts
    .filter((part) => !stopWords.has(part.toLowerCase()))
    .map((part) => part[0]?.toUpperCase())
    .filter(Boolean)
    .join("");

  return initials || parts.map((part) => part[0]?.toUpperCase()).join("");
};

const deriveShortName = (value: string, fallbackAcronym: string) => {
  const normalized = value.trim();
  if (!normalized) return fallbackAcronym;

  const transformed = normalized
    .replace(/^Bachelor\s+of\s+Science\s+in\s+/i, "BS ")
    .replace(/^Bachelor\s+of\s+Science\s+/i, "BS ")
    .replace(/^Bachelor\s+of\s+Arts\s+in\s+/i, "BA ")
    .replace(/^Bachelor\s+of\s+Arts\s+/i, "BA ")
    .replace(/^Bachelor\s+of\s+/i, "B ")
    .replace(/^Master\s+of\s+Science\s+in\s+/i, "MS ")
    .replace(/^Master\s+of\s+Arts\s+in\s+/i, "MA ");

  return transformed === normalized ? fallbackAcronym : transformed;
};

export function ResponsiveProgramText({
  fullName,
  shortName,
  acronym,
}: ResponsiveProgramTextProps) {
  const normalizedFullName = fullName?.trim() || "—";
  const normalizedAcronym = acronym?.trim() || deriveAcronym(normalizedFullName);
  const normalizedShortName = shortName?.trim() || deriveShortName(normalizedFullName, normalizedAcronym);

  return (
    <>
      <span className="inline min-[400px]:hidden">{normalizedAcronym}</span>
      <span className="hidden min-[400px]:inline min-[600px]:hidden">{normalizedShortName}</span>
      <span className="hidden min-[600px]:inline">{normalizedFullName}</span>
    </>
  );
}