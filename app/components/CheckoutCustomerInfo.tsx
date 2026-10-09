"use client";
import { ChevronLeft, Loader } from "lucide-react";
import React from "react";

export default function CheckoutCustomerInfo({ form, handleChange, handleContinue, loading, errors, isGuest = false }: {
  form: {
    email: string;
    firstName: string;
    lastName: string;
    company: string;
    phone: string;
  };
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleContinue: () => void;
  loading: boolean;
  errors: { [key: string]: string };
  isGuest?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl p-4 md:p-6 lg:p-8 shadow-md w-full lg:max-w-xl">
      <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-black">Customer Information</h2>
      {isGuest && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4 mb-4 md:mb-6">
          <p className="text-xs md:text-sm text-blue-800">
            <span className="font-semibold">Guest Checkout:</span> Complete your purchase with just an email. You can create an account after checkout to access your dashboard.
          </p>
        </div>
      )}
      <form>
        <div className="mb-3 md:mb-4">
          <label className="block font-semibold mb-1 text-gray-600 text-sm md:text-base">Email Address *</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className={`w-full border rounded-lg px-3 md:px-4 py-2 md:py-3 text-gray-600 text-sm md:text-base ${errors.email ? 'border-red-500' : 'border-[#cecece]'}`}
            placeholder="you@example.com"
            required
          />
          {errors.email && <p className="text-red-500 text-xs md:text-sm mt-1">{errors.email}</p>}
        </div>
        <div className="flex gap-2 md:gap-4 mb-3 md:mb-4 flex-col sm:flex-row">
          <div className="flex-1">
            <label className="block font-semibold mb-1 text-gray-600 text-sm md:text-base">
              First Name {!isGuest && "*"}
            </label>
            <input
              type="text"
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              className={`w-full border rounded-lg px-3 md:px-4 py-2 md:py-3 text-gray-600 text-sm md:text-base ${errors.firstName ? 'border-red-500' : 'border-[#cecece]'}`}
              placeholder="John"
              required={!isGuest}
            />
            {errors.firstName && <p className="text-red-500 text-xs md:text-sm mt-1">{errors.firstName}</p>}
          </div>
          <div className="flex-1">
            <label className="block font-semibold mb-1 text-gray-600 text-sm md:text-base">
              Last Name {!isGuest && "*"}
            </label>
            <input
              type="text"
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              className={`w-full border rounded-lg px-3 md:px-4 py-2 md:py-3 text-gray-600 text-sm md:text-base ${errors.lastName ? 'border-red-500' : 'border-[#cecece]'}`}
              placeholder="Doe"
              required={!isGuest}
            />
            {errors.lastName && <p className="text-red-500 text-xs md:text-sm mt-1">{errors.lastName}</p>}
          </div>
        </div>
        <div className="mb-3 md:mb-4">
          <label className="block font-semibold mb-1 text-gray-600 text-sm md:text-base">Company / Organization (Optional)</label>
          <input
            type="text"
            name="company"
            value={form.company}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 md:px-4 py-2 md:py-3 text-gray-600 border-[#cecece] text-sm md:text-base"
            placeholder="Your Company"
          />
        </div>
        <div className="mb-4 md:mb-6">
          <label className="block font-semibold mb-1 text-gray-600 text-sm md:text-base">Phone Number (Optional)</label>
          <input
            type="text"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 md:px-4 py-2 md:py-3 text-gray-600 border-[#cecece] text-sm md:text-base"
            placeholder="(555) 123-4567"
          />
        </div>
        <div className="flex justify-between items-center gap-3 flex-col sm:flex-row">
          <button
            type="button"
            className="text-green-700 font-semibold cursor-pointer hover:text-green-900 text-sm md:text-base"
            onClick={() => window.history.back()}
          >
            <ChevronLeft className="inline mr-1" size={16} />
            Back
          </button>
          <button
            type="button"
            className={`bg-green-800 hover:bg-green-900 cursor-pointer text-white font-semibold py-2 md:py-3 px-4 md:px-8 rounded-lg flex items-center gap-2 text-sm md:text-base w-full sm:w-auto justify-center ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={handleContinue}
            disabled={loading}
          >
            {loading && <Loader className="animate-spin" size={16} />}
            Continue to Payment
          </button>
        </div>
      </form>
    </div>
  );
}
