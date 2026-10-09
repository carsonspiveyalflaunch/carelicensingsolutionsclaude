"use client";
import React from "react";
import CheckoutPaymentForm from "./CheckoutPaymentForm";

export default function CheckoutPayment({
  total,
  onSuccess,
  onBack,
  loading,
  items,
  discountCode,
  customerInfo,
}: {
  total: number;
  onSuccess: () => void;
  onBack: () => void;
  loading: boolean;
  items: any[];
  discountCode: string;
  customerInfo: any;
}) {
  return (
    <CheckoutPaymentForm
      total={total}
      onSuccess={onSuccess}
      onBack={onBack}
      loading={loading}
      items={items}
      discountCode={discountCode}
      customerInfo={customerInfo}
    />
  );
}
