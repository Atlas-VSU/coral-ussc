"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface StudentIdInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  autoFocus?: boolean;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

export function StudentIdInput({
  value,
  onChange,
  onComplete,
  disabled = false,
  className,
  autoFocus = false,
  onKeyDown,
}: StudentIdInputProps) {
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = React.useState<number | null>(null);

  // Parse the student ID into individual digits: [X,X,X,X,X,X,X,X] for XX-X-XXXXX
  const digits = React.useMemo(() => {
    const cleaned = value.replace(/[^0-9]/g, "").padEnd(8, "");
    return cleaned.split("").slice(0, 8);
  }, [value]);

  const formatValue = (digits: string[]) => {
    const digitString = digits.join("").replace(/\s/g, "");
    if (digitString.length === 0) return "";
    if (digitString.length <= 2) return digitString;
    if (digitString.length <= 3)
      return `${digitString.slice(0, 2)}-${digitString.slice(2)}`;
    return `${digitString.slice(0, 2)}-${digitString.slice(
      2,
      3
    )}-${digitString.slice(3)}`;
  };

  const handleInputChange = (index: number, inputValue: string) => {
    if (disabled) return;

    // Only allow single numeric digit
    const numericValue = inputValue.replace(/[^0-9]/g, "").slice(0, 1);

    const newDigits = [...digits];
    newDigits[index] = numericValue;

    // Auto-advance to next input if current is filled and not the last
    if (numericValue && index < 7) {
      const nextInput = inputRefs.current[index + 1];
      if (nextInput) {
        nextInput.focus();
        setFocusedIndex(index + 1);
      }
    }

    const formattedValue = formatValue(newDigits);
    onChange(formattedValue);

    // Check if complete (all 8 digits filled) AND format is valid
    if (newDigits.every((digit) => digit !== "" && digit !== " ")) {
      const finalFormatted = formatValue(newDigits);
      // Only call onComplete if the format is valid (XX-X-XXXXX pattern)
      if (/^\d{2}-\d{1}-\d{5}$/.test(finalFormatted)) {
        onComplete?.(finalFormatted);
      }
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (disabled) return;

    onKeyDown?.(e);

    if (e.key === "Backspace") {
      // Check if current cell is empty OR if user is at the beginning of the input
      const inputEl = inputRefs.current[index];
      const isEmptyOrAtStart =
        digits[index] === "" ||
        (inputEl && inputEl.selectionStart === 0 && inputEl.selectionEnd === 0);

      if (isEmptyOrAtStart && index > 0) {
        // Move to previous cell and clear it
        const prevInput = inputRefs.current[index - 1];
        if (prevInput) {
          const newDigits = [...digits];
          newDigits[index - 1] = ""; // Clear the previous cell
          const formattedValue = formatValue(newDigits);
          onChange(formattedValue);
          prevInput.focus();
          setFocusedIndex(index - 1);
          e.preventDefault(); // Prevent default backspace behavior
        }
      } else if (digits[index] !== "") {
        // Clear current cell if it has a value
        const newDigits = [...digits];
        newDigits[index] = "";
        const formattedValue = formatValue(newDigits);
        onChange(formattedValue);
        e.preventDefault(); // Prevent default backspace behavior
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      const prevInput = inputRefs.current[index - 1];
      if (prevInput) {
        prevInput.focus();
        setFocusedIndex(index - 1);
      }
    } else if (e.key === "ArrowRight" && index < 7) {
      const nextInput = inputRefs.current[index + 1];
      if (nextInput) {
        nextInput.focus();
        setFocusedIndex(index + 1);
      }
    } else if (/^\d$/.test(e.key)) {
      // Replace current digit and move to next
      const newDigits = [...digits];
      newDigits[index] = e.key;
      const formattedValue = formatValue(newDigits);
      onChange(formattedValue);

      if (index < 7) {
        const nextInput = inputRefs.current[index + 1];
        if (nextInput) {
          nextInput.focus();
          setFocusedIndex(index + 1);
        }
      }

      // Check if complete AND format is valid
      if (newDigits.every((digit) => digit !== "" && digit !== " ")) {
        const finalFormatted = formatValue(newDigits);
        // Only call onComplete if the format is valid (XX-X-XXXXX pattern)
        if (/^\d{2}-\d{1}-\d{5}$/.test(finalFormatted)) {
          onComplete?.(finalFormatted);
        }
      }

      e.preventDefault();
    }
  };

  const handleFocus = (index: number) => {
    setFocusedIndex(index);
    // Select all text in the input for easy replacement
    const input = inputRefs.current[index];
    if (input) {
      input.select();
    }
  };

  const handleBlur = () => {
    setFocusedIndex(null);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    if (disabled) return;

    const pastedText = e.clipboardData.getData("text");
    const cleaned = pastedText.replace(/[^0-9]/g, "").slice(0, 8);

    if (cleaned.length >= 8) {
      const formattedValue = `${cleaned.slice(0, 2)}-${cleaned.slice(
        2,
        3
      )}-${cleaned.slice(3, 8)}`;
      onChange(formattedValue);

      // Only call onComplete if the format is valid
      if (/^\d{2}-\d{1}-\d{5}$/.test(formattedValue)) {
        onComplete?.(formattedValue);
      }

      // Focus the last input
      const lastInput = inputRefs.current[7];
      if (lastInput) {
        lastInput.focus();
        setFocusedIndex(7);
      }
    } else if (cleaned.length > 0) {
      // Fill as many digits as possible
      const newDigits = Array(8).fill("");
      for (let i = 0; i < Math.min(cleaned.length, 8); i++) {
        newDigits[i] = cleaned[i];
      }
      const formattedValue = formatValue(newDigits);
      onChange(formattedValue);

      // Focus the next empty input
      const nextEmptyIndex = Math.min(cleaned.length, 7);
      const nextInput = inputRefs.current[nextEmptyIndex];
      if (nextInput) {
        nextInput.focus();
        setFocusedIndex(nextEmptyIndex);
      }
    }
  };

  React.useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
      setFocusedIndex(0);
    }
  }, [autoFocus]);

  const cellClasses = (index: number) =>
    cn(
      //For responsive sizing
      "w-6 h-8",
      "min-[480px]:w-[100%] min-[480px]:h-9",
      "sm:w-[100%] sm:h-11",
      "md:w-[100%] md:h-12",
      "min-[790px]:w-[100%] min-[790px]:h-11",
      "min-[860px]:w-12 min-[861px]:h-12",

      // Large (1024px+): 52px × 52px, optimal for larger screens when button below
      "lg:w-13 lg:h-13",
      "min-[1178px]:w-14 min-[1178px]:h-14",
      // Typography scaling
      "text-center text-xs min-[480px]:text-sm sm:text-base md:text-lg lg:text-xl min-[1178px]:text-xl font-nunito-sans font-bold",

      // Border and styling
      "border-2 rounded-md sm:rounded-lg bg-white dark:bg-input transition-all outline-none",
      "focus:ring-2 focus:ring-primary/30 focus:border-primary focus:scale-105",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      "hover:border-gray-400 dark:hover:border-gray-500",
      focusedIndex === index
        ? "border-primary ring-2 ring-primary/30 scale-105 shadow-md"
        : "border-gray-300 dark:border-gray-600",
      disabled && "bg-gray-50 dark:bg-gray-800 hover:border-gray-300",
      digits[index] &&
        "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600"
    );

  const separatorClasses =
    "text-sm min-[480px]:text-base sm:text-lg md:text-xl lg:text-2xl min-[1178px]:text-2xl font-bold text-gray-400 dark:text-gray-500 select-none";

  const containerClasses = cn(
    "relative flex items-center justify-center gap-0.5 min-[480px]:gap-1 sm:gap-2 min-[790px]:gap-1.5 min-[861px]:gap-2 lg:gap-3 min-[1178px]:gap-3 select-none pb-10",
    className
  );

  return (
    <div className={containerClasses} onPaste={handlePaste}>
      {/* Year digits: XX */}
      <div className="flex items-center gap-0.5 min-[480px]:gap-1 sm:gap-2 min-[790px]:gap-1.5 min-[861px]:gap-2 lg:gap-3 min-[1178px]:gap-3">
        <input
          ref={(el) => {
            inputRefs.current[0] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[0] || ""}
          onChange={(e) => handleInputChange(0, e.target.value)}
          onKeyDown={(e) => handleKeyDown(0, e)}
          onFocus={() => handleFocus(0)}
          onBlur={handleBlur}
          disabled={disabled}
          className={cellClasses(0)}
          placeholder="0"
          aria-label="Year first digit"
        />
        <input
          ref={(el) => {
            inputRefs.current[1] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[1] || ""}
          onChange={(e) => handleInputChange(1, e.target.value)}
          onKeyDown={(e) => handleKeyDown(1, e)}
          onFocus={() => handleFocus(1)}
          onBlur={handleBlur}
          disabled={disabled}
          className={cellClasses(1)}
          placeholder="0"
          aria-label="Year second digit"
        />
      </div>

      {/* Separator */}
      <div className={separatorClasses}>-</div>

      {/* Semester digit: X */}
      <div className="flex items-center">
        <input
          ref={(el) => {
            inputRefs.current[2] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[2] || ""}
          onChange={(e) => handleInputChange(2, e.target.value)}
          onKeyDown={(e) => handleKeyDown(2, e)}
          onFocus={() => handleFocus(2)}
          onBlur={handleBlur}
          disabled={disabled}
          className={cellClasses(2)}
          placeholder="0"
          aria-label="Semester"
        />
      </div>

      {/* Separator */}
      <div className={separatorClasses}>-</div>

      {/* ID number digits: XXXXX */}
      <div className="flex items-center gap-0.5 min-[480px]:gap-1 sm:gap-2 min-[790px]:gap-1.5 min-[861px]:gap-2 lg:gap-3 min-[1178px]:gap-3">
        {[3, 4, 5, 6, 7].map((index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digits[index] || ""}
            onChange={(e) => handleInputChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onFocus={() => handleFocus(index)}
            onBlur={handleBlur}
            disabled={disabled}
            className={cellClasses(index)}
            placeholder={["0", "0", "0", "0", "0"][index - 3]}
            aria-label={`ID digit ${index - 2}`}
          />
        ))}
      </div>
    </div>
  );
}
