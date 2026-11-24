import React from "react";

import { FaFileInvoiceDollar } from "react-icons/fa6";

export default function InvoiceOtherInfo({ information }) {
  return (
    <div className="mt-7 rounded-lg border border-slate-200 bg-slate-50 p-5">
      <div className="mb-3 flex items-center gap-2">
        <FaFileInvoiceDollar className="text-blue-600" />

        <h3 className="font-semibold text-slate-900">Other Information</h3>
      </div>

      <p className="text-xs leading-5 text-slate-500">{information}</p>
    </div>
  );
}
