import { Check } from "lucide-react";
import React from "react";

interface StepperProps {
  currentStep: number;
  steps: string[];
}

export default function Stepper({ currentStep, steps }: StepperProps) {
  return (
    <div className="w-full flex items-center justify-center bg-white py-8 px-4">
      <div className="flex w-full max-w-4xl items-center">
        {steps.map((step, idx) => (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center flex-1">
              <div
                className={`rounded-full w-10 h-10 flex items-center justify-center font-bold border-2 ${
                  idx + 1 === currentStep
                    ? "bg-[#417a5a] text-white border-[#417a5a] shadow-lg"
                    : idx + 1 < currentStep
                    ? "bg-[#b6ff7a] text-[#417a5a] border-[#417a5a]"
                    : "bg-[#f5f5f5] text-[#417a5a] border-[#b6ff7a]"
                }`}
              >
                {idx + 1 < currentStep ? <Check /> : idx + 1 === currentStep ? idx + 1 : idx + 1}
              </div>
              <span
                className={`mt-2 text-xs font-semibold ${
                  idx + 1 === currentStep ? "text-[#417a5a]" : "text-[#417a5a] opacity-60"
                }`}
              >
                {step}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className="flex-1 border-t-2 border-[#b6ff7a] mx-2 mt-5"></div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
