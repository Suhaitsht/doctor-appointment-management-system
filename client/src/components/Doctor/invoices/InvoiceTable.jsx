import React from "react";

import { FaEye, FaFileInvoiceDollar } from "react-icons/fa6";

import { Card } from "@/components/ui/card";

export default function InvoiceTable({ invoices, onViewInvoice }) {
  return (
    <Card className="overflow-hidden border-slate-200 shadow-none">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[850px] text-left text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-5 py-4">ID</th>

              <th className="px-5 py-4">Patient</th>

              <th className="px-5 py-4">Appointment Date</th>

              <th className="px-5 py-4">Booked On</th>

              <th className="px-5 py-4">Amount</th>

              <th className="px-5 py-4">Action</th>
            </tr>
          </thead>

          <tbody>
            {invoices.map((invoice) => (
              <tr
                key={invoice.id}
                className="border-t border-slate-100 hover:bg-slate-50"
              >
                <td className="px-5 py-4 text-blue-600">#{invoice.id}</td>

                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={invoice.patientImage}
                      alt={invoice.patient}
                      className="h-9 w-9 rounded-full object-cover"
                    />

                    <span className="font-medium text-slate-800">
                      {invoice.patient}
                    </span>
                  </div>
                </td>

                <td className="px-5 py-4 text-slate-600">
                  {invoice.appointmentDate}
                </td>

                <td className="px-5 py-4 text-slate-600">{invoice.bookedOn}</td>

                <td className="px-5 py-4 font-medium">${invoice.amount}</td>

                <td className="px-5 py-4">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onViewInvoice(invoice)}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 hover:bg-blue-50 hover:text-blue-600"
                    >
                      <FaFileInvoiceDollar />
                    </button>

                    <button
                      type="button"
                      onClick={() => onViewInvoice(invoice)}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 hover:bg-blue-50 hover:text-blue-600"
                    >
                      <FaEye />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {invoices.length === 0 && (
              <tr>
                <td colSpan={6} className="py-14 text-center text-slate-400">
                  No invoices found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
