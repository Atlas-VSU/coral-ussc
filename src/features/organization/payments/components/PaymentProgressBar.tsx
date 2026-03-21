interface PaymentProgressBarProps {
  currentStep: 1 | 2 | 3 | 4;
  subtitle?: string;
}

const steps = [
  { id: 1, label: "Verification" },
  { id: 2, label: "Organization" },
  { id: 3, label: "Selection" },
  { id: 4, label: "Payment" },
] as const;

export function PaymentProgressBar({ currentStep, subtitle }: PaymentProgressBarProps) {
  return (
    <div className="w-full max-w-2xl mx-auto px-2">
      <div className="grid grid-cols-4 items-start">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.id;
          const isActive = currentStep === step.id;

          return (
            <div key={step.id} className="relative flex flex-col items-center min-w-0">
              {index < steps.length - 1 && (
                <div
                  className={`absolute top-4 left-1/2 h-0.5 w-full ${
                    currentStep > step.id ? "bg-[#1B5E20]" : "bg-border"
                  }`}
                />
              )}

              <div className="relative z-10 flex flex-col items-center gap-1.5 min-w-0">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                    isCompleted || isActive
                      ? "bg-[#1B5E20] text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step.id}
                </div>
                <span
                  className={`hidden min-[360px]:block text-[11px] sm:text-xs text-center ${
                    isCompleted || isActive ? "text-foreground font-medium" : "text-muted-foreground"
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