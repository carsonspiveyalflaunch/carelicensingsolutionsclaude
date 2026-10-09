"use client";
import React, { useState } from "react";
import { useCart } from "./cart-context";
import { Trash2, Lock, Zap, Shield, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Swal from "sweetalert2";

export default function CartClient() {
  const { items, loaded, removeItem, clearCart } = useCart();
  const [promo, setPromo] = useState("");

  if (!loaded) {
    return (
      <div className="min-h-[300px] bg-white rounded-xl shadow p-8 text-center text-gray-500">
        Loading cart...
      </div>
    );
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
  const formattedSubtotal = subtotal.toFixed(2);
  // For demo, promo code does nothing

  const handleRemoveItem = async (itemId: string, itemName: string) => {
    const result = await Swal.fire({
      title: 'Remove Item?',
      text: `Are you sure you want to remove "${itemName}" from your cart?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, remove it!',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      removeItem(itemId);
      Swal.fire({
        title: 'Removed!',
        text: 'Item has been removed from your cart.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    }
  };

  const handleClearCart = async () => {
    const result = await Swal.fire({
      title: 'Clear Cart?',
      text: 'Are you sure you want to remove all items from your cart?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, clear cart!',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      clearCart();
      Swal.fire({
        title: 'Cleared!',
        text: 'All items have been removed from your cart.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Cart Items */}
      <div className="flex-1">
        {items.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
            Your cart is empty.
          </div>
        ) : (
          <div className="space-y-6">
            {items.map((item) => (
              <div key={item.id} className="flex md:items-center md:flex-row flex-col gap-6 bg-white rounded-xl border p-6">
                <div className="bg-green-800 text-white rounded-full w-14 h-14 flex items-center justify-center font-bold text-xl">
                  {item.state ? item.state.slice(0, 2).toUpperCase() : item.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-lg mb-1 text-black">{item.name}</div>
                  <div className="flex gap-2 mb-1">
                    <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded">Bundle</span>
                    <span className="bg-gray-100 text-gray-700 text-xs font-semibold px-2 py-1 rounded">PDF</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-2xl font-bold text-gray-900">${item.price}</span>
                  </div>
                </div>
                <button className="flex flex-col items-center text-red-600 hover:text-red-800 text-sm" onClick={() => handleRemoveItem(item.id, item.name)}>
                  <Trash2 className="mb-1" />
                  Remove
                </button>
              </div>
            ))}
            <button className="text-red-600 hover:text-red-800 text-sm mt-2 ml-auto block" onClick={handleClearCart}>
              Clear Cart
            </button>
          </div>
        )}
        <a href="/shop" className="mt-8 inline-flex items-center gap-2 text-green-900 font-semibold hover:underline">
          <span className=""> <ArrowLeft size={15} /> </span> Continue Shopping
        </a>
      </div>
      {/* Order Summary */}
      <div className="w-full max-w-sm bg-white rounded-xl border p-6 h-fit">
        <h2 className="font-bold text-xl mb-4 text-black">Order Summary</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-black">Promo Code</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={promo}
              onChange={e => setPromo(e.target.value)}
              className="text-black flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
              placeholder="Enter code"
            />
            <button className="border border-green-700 text-green-800 font-semibold px-4 py-1.5 rounded hover:bg-green-50 transition">Apply</button>
          </div>
        </div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-black">Subtotal</span>
          <span className="text-black">${formattedSubtotal}</span>
        </div>
        <div className="flex justify-between text-lg font-bold mb-4">
          <span className="text-black">Total</span>
          <span className="text-black">${formattedSubtotal}</span>
        </div>
        {items.length > 0 ? (
          <a href="/checkout" className="w-full block bg-green-800 text-white font-semibold py-3 rounded-lg hover:bg-green-900 transition mb-4 text-center">
            Proceed to Checkout
          </a>
        ) : (
          <button className="w-full bg-gray-300 text-gray-500 font-semibold py-3 rounded-lg mb-4 cursor-not-allowed" disabled>
            Proceed to Checkout
          </button>
        )}
        <div className="space-y-2 text-xs text-gray-600 mt-2">
          <div className="flex items-center gap-2"><Lock className="text-green-700 w-4 h-4" /> Secure checkout</div>
          <div className="flex items-center gap-2"><Zap className="text-green-700 w-4 h-4" /> Instant digital delivery</div>
          <div className="flex items-center gap-2"><Shield className="text-green-700 w-4 h-4" /> 256-bit SSL encryption</div>
        </div>
      </div>
    </div>
  );
}
