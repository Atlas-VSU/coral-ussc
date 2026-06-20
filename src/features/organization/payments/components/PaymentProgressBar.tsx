interface PaymentProgressBarProps {
  currentStep: 1 | 2 | 3 | 4 | 5;
  subtitle?: string;
}

const steps = [
  { id: 1, label: "Verification" },
  { id: 2, label: "Term" },
  { id: 3, label: "Organization" },
  { id: 4, label: "Selection" },
  { id: 5, label: "Payment" },
] as const;

export function PaymentProgressBar({ currentStep, subtitle }: PaymentProgressBarProps) {
  return (
    <div className="w-full max-w-2xl mx-auto px-2">
      {/* FIXED: Changed grid-cols-4 to grid-cols-5 to accommodate the 5 steps */}
      <div className="grid grid-cols-5 items-start">
        {steps.map((step, index) => {
          // Derive visual state strictly from the parent prop
          const isCompleted = currentStep > step.id;
          const isActive = currentStep === step.id;

          return (
            <div key={step.id} className="relative flex flex-col items-center min-w-0">
              
              {/* The Connecting Line */}
              {index < steps.length - 1 && (
                <div
                  className={`absolute top-4 left-1/2 h-0.5 w-full ${
                    isCompleted ? "bg-[#1B5E20]" : "bg-border"
                  }`}
                />
              )}

              {/* The Step Indicator (Circle & Text) */}
              <div className="relative z-10 flex flex-col items-center gap-1.5 min-w-0">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                    isCompleted || isActive
                      ? "bg-[#1B5E20] text-white" // Active/Done state (Dark Green)
                      : "bg-muted text-muted-foreground" // Future state (Gray)
                  }`}
                >
                  {step.id}
                </div>
                <span
                  className={`hidden min-[420px]:block text-[11px] sm:text-xs text-center ${
                    isCompleted || isActive 
                      ? "text-foreground font-medium" 
                      : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      {subtitle && (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {subtitle}
        </p>
      )}
    </div>
  );
}