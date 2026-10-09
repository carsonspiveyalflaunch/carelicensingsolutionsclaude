import React from "react";
import Stepper from "./Stepper";
import { useRouter } from "next/navigation";
import GetStartedSidebar from "./GetStartedSidebar";
import GetStartedStickyBar from "./GetStartedStickyBar";
import { useCart } from "./cart-context";

export default function GetStartedComponentFour({
  steps,
  selectedState,
  selectedType,
  stateNames,
}: {
  steps: string[];
  selectedState: string;
  selectedType: string;
  stateNames: { [abbr: string]: string };
}) {
  const router = useRouter();
  const { items } = useCart();

  // Calculate totals from cart items
  const subtotal = items.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
  const taxRate = 0.08; // 8% tax
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;
  return (
    <>
      <Stepper currentStep={4} steps={steps} />
      <section className="flex flex-col items-center justify-center py-4 md:py-8 pb-24 md:pb-32 px-4">
        <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-4 lg:gap-8">
          {/* Sidebar (filter selection bar) */}
          <GetStartedSidebar
            stateNames={stateNames}
            selectedState={selectedState}
            selectedType={selectedType}
            programTypes={[]}
            disableState={true}
            disableType={true}
          />
          {/* Main summary */}
          <main className="flex-1">
            <div className="bg-white rounded-xl border border-[#eaffea] p-4 md:p-6 shadow-sm">
              <h3 className="font-bold text-lg md:text-xl mb-4 text-black">
                Order Summary
              </h3>
              <div className="flex flex-wrap gap-2 mb-3 md:mb-2">
                <span className="bg-[#eaffea] text-[#417a5a] font-semibold px-2 py-1 md:px-3 md:py-1 rounded-full text-sm">
                  {stateNames[selectedState]}
                </span>
                <span className="bg-[#eaffea] text-[#417a5a] font-semibold px-2 py-1 md:px-3 md:py-1 rounded-full text-sm">
                  {selectedType}
                </span>
              </div>
              
              {/* Cart Items */}
              <div className="mb-4 pb-4 border-b border-[#eaffea]">
                <div className="text-sm text-gray-700 font-semibold mb-2">Items in cart:</div>
                {items.length === 0 ? (
                  <div className="text-gray-500 text-sm">No items in cart</div>
                ) : (
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-gray-700">{item.name}</span>
                        <span className="font-semibold text-gray-700">${item.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mb-2">
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Promo Code
                </label>
                <div className="flex gap-2">
                  <input
                    className="border rounded px-3 py-2 flex-1 text-black text-sm md:text-base"
                    placeholder="Enter code"
                  />
                  <button className="bg-[#eaffea] text-[#417a5a] font-semibold px-3 py-2 md:px-4 rounded text-sm md:text-base">
                    Apply
                  </button>
                </div>
              </div>
              <div className="flex justify-between mb-2 text-sm md:text-base">
                <span className="text-gray-700">Subtotal</span>
                <span className="font-semibold text-gray-700">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-4 text-sm md:text-base">
                <span className="text-gray-700">Tax (8%)</span>
                <span className="font-semibold text-gray-700">${taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base md:text-lg font-bold mb-4">
                <span className="text-gray-700">Total</span>
                <span className="text-gray-700">${total.toFixed(2)}</span>
              </div>
              <div className="text-xs text-gray-700 text-center mt-4 md:mt-6">
                All sales are final. This product is an informational resource
                and does not constitute legal, financial, or professional
                compliance advice.
              </div>
              <GetStartedStickyBar
                onBack={() => router.back()}
                onContinue={() => router.push("/checkout")}
                continueDisabled={false}
              />
            </div>
          </main>
        </div>
      </section>
    </>
  );
}
