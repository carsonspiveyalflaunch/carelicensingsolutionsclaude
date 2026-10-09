import Stepper from "./Stepper";
import { programTypeIcons } from "./lucide-icons";
import { useRouter } from "next/navigation";
import React from "react";
import Swal from "sweetalert2";
import GetStartedSidebar from "./GetStartedSidebar";
import GetStartedStickyBar from "./GetStartedStickyBar";

export default function GetStartedComponentTwo({
  steps,
  currentStep,
  selectedState,
  stateNames,
  programTypes,
  selectedType,
}: {
  steps: string[];
  currentStep: number;
  selectedState: string;
  stateNames: { [abbr: string]: string };
  programTypes: { key: string; desc: string }[];
  selectedType: string | null;
}) {
  const router = useRouter();
  return (
    <>
      <Stepper currentStep={currentStep} steps={steps} />
      <section className="flex flex-col items-center justify-center py-4 md:py-8 pb-24 md:pb-32 px-4">
        {/* State badge at top */}
        <div className="w-full max-w-6xl flex flex-col sm:flex-row items-start sm:items-center mb-4 gap-2">
          <span className="bg-[#eaffea] text-[#417a5a] font-semibold px-3 py-1.5 rounded-full text-sm">State:</span>
          <span className="bg-[#417a5a] text-white font-semibold px-3 py-1.5 rounded-full text-sm">{stateNames[selectedState]}</span>
        </div>
        {/* Main content: sidebar + program types */}
        <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-4 lg:gap-8">
          {/* Sidebar */}
          <GetStartedSidebar
            stateNames={stateNames}
            selectedState={selectedState}
            selectedType={selectedType || ''}
            programTypes={programTypes}
            onStateChange={abbr => router.push(`/get-started?state=${abbr}`)}
            onTypeChange={type => router.push(`/get-started?state=${selectedState}&type=${encodeURIComponent(type)}`)}
          />
          {/* Program types grid */}
          <main className="flex-1">
            <h2 className="text-xl md:text-2xl font-bold text-[#417a5a] mb-2 text-center">Select Program Type in {stateNames[selectedState]}</h2>
            <p className="text-[#417a5a] mb-4 md:mb-6 text-center text-sm md:text-base">Choose the type of care business you want to license</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 w-full">
              {programTypes.map((type) => {
                const isSelected = selectedType === type.key;
                return (
                  <button
                    key={type.key}
                    className={`bg-white border rounded-xl p-4 md:p-6 flex flex-col items-start shadow-sm cursor-pointer transition-all duration-150 outline-none focus:ring-2 focus:ring-[#417a5a] ${isSelected ? "border-[#417a5a] ring-2 ring-[#417a5a] bg-[#eaffea]" : "border-[#eaffea] hover:border-[#417a5a]"}`}
                    onClick={() => router.push(`/get-started?state=${selectedState}&type=${encodeURIComponent(type.key)}`)}
                    tabIndex={0}
                  >
                    <span className="font-semibold text-[#417a5a] mb-2 flex items-start gap-2 text-sm md:text-base"><span className="mt-0.5 md:mt-1 shrink-0 text-lg md:text-xl">{programTypeIcons[type.key]}</span> <span className="text-start">{type.key}</span></span>
                    <span className="text-xs text-[#417a5a] text-start">{type.desc}</span>
                  </button>
                );
              })}
            </div>
          </main>
        </div>
      </section>
      <GetStartedStickyBar
        onBack={() => router.push("/get-started")}
        onContinue={() => {
          if (!selectedType) {
            Swal.fire({
              icon: "warning",
              title: "Select a program type",
              text: "Please choose a program type to continue.",
              confirmButtonColor: "#417a5a"
            });
            return;
          }
          router.push(`/get-started?state=${selectedState}&type=${encodeURIComponent(selectedType)}`);
        }}
        continueDisabled={!selectedType}
      />
    </>
  );
}
