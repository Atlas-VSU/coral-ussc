interface PaymentProgressBarProps {
  currentStep: 1 | 2 | 3 | 4;
}

const steps = [
  { id: 1, label: "Verification" },
  { id: 2, label: "Organization" },
  { id: 3, label: "Selection" },
  { id: 4, label: "Payment" },
] as const;

export function PaymentProgressBar({ currentStep }: PaymentProgressBarProps) {
  return (
    <div className="w-full max-w-3xl mx-auto px-2">
      <div className="flex items-center justify-between gap-2">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.id;
          const isActive = currentStep === step.id;

          return (
            <div key={step.id} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1.5 min-w-0">
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
                  className={`text-[11px] sm:text-xs text-center ${
                    isCompleted || isActive ? "text-foreground font-medium" : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`mx-2 h-0.5 flex-1 rounded-full ${
                    currentStep > step.id ? "bg-[#1B5E20]" : "bg-border"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}