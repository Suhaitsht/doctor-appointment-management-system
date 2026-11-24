import React from "react";

export default function InvoiceItemsTable({ items }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-slate-900">
        Invoice Details
      </h3>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full min-w-[550px] text-xs">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-3 text-left">Description</th>

              <th className="px-4 py-3 text-center">Quantity</th>

              <th className="px-4 py-3 text-center">VAT</th>

              <th className="px-4 py-3 text-right">Total</th>
            </tr>
          </thead>

          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="border-t border-slate-100">
                <td className="px-4 py-3">{item.description}</td>

                <td className="px-4 py-3 text-center">{item.quantity}</td>

                <td className="px-4 py-3 text-center">${item.vat}</td>

                <td className="px-4 py-3 text-right">${item.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
