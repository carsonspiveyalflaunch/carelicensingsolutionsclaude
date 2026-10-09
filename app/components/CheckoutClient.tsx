"use client";
import React, { useState, useEffect } from "react";
import { Check, LogIn } from "lucide-react";
import { useCart } from "../components/cart-context";
import { useAuth } from "../components/AuthContext";
import AuthModal from "./AuthModal";
import CheckoutCustomerInfo from "./CheckoutCustomerInfo";
import CheckoutPayment from "./CheckoutPayment";
import CheckoutPaymentConfirmation from "./CheckoutPaymentConfirmation";
import { useToast } from "./SimpleToast";

function Stepper({ step }: { step: number }) {
  const steps = ["Cart", "Information", "Payment", "Confirmation"];
  return (
    <div className="flex items-center justify-center gap-4 lg:gap-8 py-4 md:py-8 px-2 overflow-x-auto">
      {steps.map((label, idx) => {
        const isCompleted = step > idx + 1;
        const isActive = step === idx + 1;
        return (
          <div key={label} className="flex items-center md:flex-row flex-col gap-0.5 md:gap-2 flex-shrink-0">
            <div
              className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center font-bold text-xs md:text-lg flex-shrink-0 ${
                isActive || isCompleted
                  ? "bg-green-800 text-white"
                  : "bg-gray-100 text-green-800"
              }`}
            >
              {isCompleted ? <Check size={16} className="md:w-[22px] md:h-[22px]" /> : idx + 1}
            </div>
            <span
              className={`text-xs md:text-sm lg:text-base sm:inline ${
                isActive
                  ? "font-semibold text-black"
                  : isCompleted
                    ? "text-green-800 font-semibold"
                    : "text-gray-500"
              }`}
            >
              {label}
            </span>
            {idx < steps.length - 1 && (
              <div className="w-2 md:w-4 lg:w-16 h-px bg-gray-300 mx-0.5 md:mx-2" />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function CheckoutClient() {
  const { items, loaded, clearCart } = useCart();
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState(2);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    company: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [discountCode, setDiscountCode] = useState("");
  const [discountApplied, setDiscountApplied] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [orderNumber, setOrderNumber] = useState("");
  const [orderDate, setOrderDate] = useState("");
  const [confirmationData, setConfirmationData] = useState<{
    email: string;
    items: { name: string; price: number }[];
    discount: number;
    tax: number;
    orderNumber: string;
    orderDate: string;
  }>({
    email: "",
    items: [],
    discount: 0,
    tax: 0,
    orderNumber: "",
    orderDate: "",
  });
  const [paymentRetries, setPaymentRetries] = useState(0);
  const toast = useToast();

  // Load saved form data from localStorage
  useEffect(() => {
    const savedForm = localStorage.getItem("checkoutForm");
    if (savedForm) {
      setForm(JSON.parse(savedForm));
    }
  }, []);

  // Save form data to localStorage
  useEffect(() => {
    localStorage.setItem("checkoutForm", JSON.stringify(form));
  }, [form]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
  }

  function validateForm() {
    const newErrors: { [key: string]: string } = {};
    if (!form.email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email))
      newErrors.email = "Invalid email format";
    // For authenticated users, require first and last name. For guests, it's optional
    if (user) {
      if (!form.firstName.trim()) newErrors.firstName = "First name is required";
      if (!form.lastName.trim()) newErrors.lastName = "Last name is required";
    }
    return newErrors;
  }

  function generateOrderNumber() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `CLS-${timestamp.toString().slice(-6)}-${random}`;
  }

  // Validate and apply discount code
  async function applyDiscountCode() {
    const validCodes: { [key: string]: number } = {
      SAVE10: 10,
      SAVE15: 15,
      LAUNCH20: 20,
      WELCOME5: 5,
    };

    if (!discountCode.trim()) {
      toast.show("Please enter a discount code");
      return;
    }

    const code = discountCode.trim().toUpperCase();

    if (code.startsWith("CLS-")) {
      try {
        const response = await fetch("/api/coupons/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, email: form.email }),
        });
        const result = await response.json();

        if (!response.ok || !result.valid) {
          throw new Error(result.error || "Invalid coupon");
        }

        setDiscountPercent(100);
        setDiscountApplied(true);
        toast.show("Course coupon applied! Your total is $0.00");
      } catch (error: any) {
        toast.show(error.message || "Invalid coupon code");
        setDiscountApplied(false);
        setDiscountPercent(0);
      }
      return;
    }

    if (validCodes[code]) {
      setDiscountPercent(validCodes[code]);
      setDiscountApplied(true);
      toast.show(`Discount code applied! Save ${validCodes[code]}%`);
    } else {
      toast.show("Invalid discount code");
      setDiscountApplied(false);
      setDiscountPercent(0);
    }
  }

  function handleContinue() {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.show("Please fill in all required fields correctly.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setStep(3);
      setLoading(false);
      toast.show("Information saved successfully!");
    }, 1500);
  }

  function handlePaymentSuccess() {
    const newOrderNumber = generateOrderNumber();
    const newOrderDate = new Date().toISOString();

    // record confirmation data before clearing
    setConfirmationData({
      email: form.email,
      items: items.map((item) => ({ name: item.name, price: item.price })),
      discount: discountAmount,
      tax: taxAmount,
      orderNumber: newOrderNumber,
      orderDate: newOrderDate,
    });

    setOrderNumber(newOrderNumber);
    setOrderDate(newOrderDate);
    setStep(4);
    setPaymentRetries(0);
    toast.show("Payment completed successfully!");

    // Save order to history
    const order = {
      orderNumber: newOrderNumber,
      customerEmail: form.email,
      customerName: `${form.firstName} ${form.lastName}`,
      items: items.map((item) => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity || 1,
      })),
      subtotal,
      discount: discountAmount,
      tax: taxAmount,
      total: total,
      date: newOrderDate,
      status: "completed",
    };

    const orders = JSON.parse(localStorage.getItem("orderHistory") || "[]");
    orders.push(order);
    localStorage.setItem("orderHistory", JSON.stringify(orders));

    // Send confirmation email (simulated)
    simulateSendEmail(form.email, order);

    // Clear form and cart after capturing confirmation data
    setForm({ email: "", firstName: "", lastName: "", company: "", phone: "" });
    localStorage.removeItem("checkoutForm");
    clearCart();
  }

  function simulateSendEmail(email: string, order: any) {
    setTimeout(() => {
      toast.show(`Confirmation email sent to ${email}`);
      console.log("Order confirmation email sent:", order);
    }, 1000);
  }

  function handlePaymentBack() {
    setStep(2);
  }

  function handlePaymentRetry() {
    if (paymentRetries < 2) {
      setPaymentRetries(paymentRetries + 1);
      setStep(3);
      toast.show(`Retry attempt ${paymentRetries + 1}/3`);
    } else {
      toast.show("Maximum retry attempts reached. Please contact support.");
    }
  }

  if (!loaded || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-600">Loading...</div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!user) {
    console.log("User not authenticated - allowing guest checkout");
  }

  if (items.length === 0 && step < 4) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-xl shadow-md">
          <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <LogIn size={32} className="text-green-600" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold mb-3 text-gray-900">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">
            Add a program to your cart before continuing to checkout.
          </p>
          <a
            href="/shop"
            className="w-full inline-flex justify-center bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition"
          >
            Browse Programs
          </a>
        </div>
      </div>
    );
  }

  // Rest of the component continues...

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * (item.quantity || 1),
    0,
  );
  const discountAmount = (subtotal * discountPercent) / 100;
  const taxRate = 0.08; // 8% tax
  const taxAmount = (subtotal - discountAmount) * taxRate;
  const total = subtotal - discountAmount + taxAmount;

  // Order summary with discount and tax
  function OrderSummary() {
    return (
      <div className="bg-white rounded-xl p-4 md:p-6 lg:p-8 shadow-md w-full lg:max-w-md">
        <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4 text-black">Order Summary</h2>
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between mb-3 md:mb-4 gap-2">
            <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
              <div className="w-8 h-8 md:w-10 md:h-10 shrink-0 rounded-full bg-green-800 text-white flex items-center justify-center font-bold text-xs md:text-lg">
                {item.state ? item.state.slice(0, 2).toUpperCase() : "CT"}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-black text-sm md:text-base truncate">{item.name}</div>
                {/* Show program type from metadata if available */}
                {item.metadata?.program && (
                  <div className="text-xs text-gray-600 truncate">{item.metadata.program}</div>
                )}
                {/* Show file type indicator or product type */}
                {/* <div className="text-xs text-gray-500">
                  {item.type === "bundle" ? "Complete Bundle" : "Individual Document"}
                </div> */}
              </div>
            </div>
            <div className="font-bold text-black text-sm md:text-lg flex-shrink-0 ml-2">${item.price}</div>
          </div>
        ))}

        {/* Discount Code Section */}
        {step < 4 && (
          <div className="border-t pt-3 md:pt-4 mt-3 md:mt-4 mb-3 md:mb-4">
            <label className="block text-xs md:text-sm font-semibold text-gray-600 mb-2">
              Promo Code
            </label>
            <div className="flex gap-2 flex-col sm:flex-row">
              <input
                type="text"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
                placeholder="Enter code"
                className="flex-1 border rounded-lg px-3 py-2 text-xs md:text-sm text-gray-600 border-gray-300"
              />
              <button
                onClick={applyDiscountCode}
                className="bg-green-700 hover:bg-green-800 text-white font-semibold px-3 py-2 rounded-lg text-xs md:text-sm whitespace-nowrap"
              >
                Apply
              </button>
            </div>
            {discountApplied && (
              <p className="text-xs text-green-700 mt-1">✓ Code applied</p>
            )}
          </div>
        )}

        <div className="border-t pt-3 md:pt-4 mt-3 md:mt-4">
          <div className="flex justify-between mb-2 text-xs md:text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-semibold text-black">
              ${subtotal.toFixed(2)}
            </span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between mb-2 text-green-700 text-xs md:text-sm">
              <span>Discount ({discountPercent}%)</span>
              <span className="font-semibold">
                -${discountAmount.toFixed(2)}
              </span>
            </div>
          )}
          <div className="flex justify-between mb-2 text-xs md:text-sm">
            <span className="text-gray-600">Tax (8%)</span>
            <span className="font-semibold text-black">
              ${taxAmount.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between border-t pt-2 md:pt-3">
            <span className="font-bold text-base md:text-lg text-gray-600">Total</span>
            <span className="font-bold text-base md:text-lg text-black">
              ${total.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-green-800">
            <span>Secure checkout powered by Stripe</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pt-20 pb-10">
      <Stepper step={step} />
      <div className="flex justify-center items-start gap-4 md:gap-8 px-4 md:px-8 flex-col lg:flex-row">
        {/* Left: Step Components */}
        {step === 2 && (
          <CheckoutCustomerInfo
            form={form}
            handleChange={handleChange}
            handleContinue={handleContinue}
            loading={loading}
            errors={errors}
            isGuest={!user}
          />
        )}
        {step === 3 && (
          <CheckoutPayment
            total={total}
            onSuccess={handlePaymentSuccess}
            onBack={handlePaymentBack}
            loading={loading}
            items={items}
            discountCode={discountCode}
            customerInfo={form}
          />
        )}
        {step === 4 && (
          <div className="w-full">
            <CheckoutPaymentConfirmation
              orderNumber={confirmationData.orderNumber}
              customerEmail={confirmationData.email}
              items={confirmationData.items}
              downloads={confirmationData.items.map((item) => ({
                name: item.name,
                type: "PDF",
              }))}
              onlineAccess={
                confirmationData.items.some((i) => i.name.toLowerCase().includes("bundle"))
                  ? [
                      { name: "Video Training Course", type: "Full Access" },
                      { name: "Private Community Access", type: "Premium Access" },
                    ]
                  : [{ name: "Video Training Course", type: "Full Access" }]
              }
              discount={confirmationData.discount}
              tax={confirmationData.tax}
              orderDate={confirmationData.orderDate}
              paymentStatus="Completed"
            />
          </div>
        )}
        {/* Right: Order Summary (hidden on confirmation step, stacks below on mobile) */}
        {step !== 4 && <div className="w-full lg:w-auto"><OrderSummary /></div>}
      </div>
    </div>
  );
}
