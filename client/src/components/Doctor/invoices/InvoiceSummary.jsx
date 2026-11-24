import React from "react";

export default function InvoiceSummary({ subtotal, discount, totalAmount }) {
  return (
    <div className="mt-5 flex justify-end">
      <div className="w-full max-w-[260px] space-y-2 text-xs">
        <SummaryRow label="Subtotal" value={`$${subtotal}`} />

        <SummaryRow label="Discount" value={`-${discount}%`} />

        <div className="flex justify-between border-t border-slate-200 pt-3 font-semibold">
          <span>Total Amount</span>

          <span className="text-blue-600">${totalAmount}</span>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex justify-between text-slate-600">
      <span>{label}:</span>

      <span>{value}</span>
    </div>
  );
}
