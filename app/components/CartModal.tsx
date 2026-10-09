"use client";
import React from "react";
import { useCart } from "./cart-context";
import { X } from "lucide-react";
import Link from "next/link";
import { BsCart } from "react-icons/bs";

export default function CartModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { items, removeItem } = useCart();
  if (!open) return null;

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * (item.quantity || 1),
    0,
  );

  const formattedSubtotal = subtotal.toFixed(2);

  // Dropdown style: absolute, right-0, top-full, shadow, z-50
  return (
    <div className="absolute right-0 top-full mt-2 z-50 w-80 max-w-xs bg-white rounded-xl shadow-xl p-6 animate-fadeIn flex flex-col border border-gray-200">
      <button
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 cursor-pointer"
        onClick={onClose}
        aria-label="Close"
      >
        <X />
      </button>
      <h2 className="text-lg font-semibold mb-4 text-black">Shopping Cart</h2>
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8">
          <span className="text-4xl mb-2 text-green-700"> <BsCart /> </span>
          <p className="text-gray-500 mb-4">Your cart is empty</p>
          <a
            className="border border-green-700 text-green-800 font-semibold px-6 py-2 rounded-lg hover:bg-green-50 transition"
            href="/shop"
          >
            Browse Products
          </a>
        </div>
      ) : (
        <>
          <div className="max-h-48 overflow-auto">
            {items.map((item) => (
              <div key={item.id} className="flex items-start gap-3 mb-4">
                <div className="bg-green-800 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg">
                  {item.state
                    ? item.state.slice(0, 2).toUpperCase()
                    : item.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="font-semibold leading-tight text-black">
                    {item.name}
                  </div>
                  <div className="text-xs text-gray-500">{item.type}</div>
                  <div className="text-green-700 font-bold">${item.price}</div>
                </div>
                <button
                  className="text-gray-400 hover:text-red-600 text-xl"
                  onClick={() => removeItem(item.id)}
                  aria-label="Remove"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="flex justify-between font-semibold mt-2 mb-4">
            <span className="text-black">Subtotal</span>
            <span className="text-black">${formattedSubtotal}</span>
          </div>
          <div className="flex gap-2">
            <a
              href="/cart"
              className="flex-1 border border-green-700 text-center text-green-800 font-semibold px-4 py-2 rounded-lg hover:bg-green-50 transition"
            >
              View Cart
            </a>
            <a href="/checkout" className="flex-1 text-center bg-green-800 text-white font-semibold px-4 py-2 rounded-lg hover:bg-green-900 transition">
              Checkout
            </a>
          </div>
        </>
      )}
    </div>
  );
}
