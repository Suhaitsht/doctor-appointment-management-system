import React from "react";

import { FaDownload, FaPrint } from "react-icons/fa6";

import { Button } from "@/components/ui/button";

export default function InvoiceHeader({ invoiceNo, issuedDate }) {
  return (
    <>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-slate-700">{issuedDate}</p>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.print()}
            className="gap-2"
          >
            <FaPrint />
            Print
          </Button>

          <Button type="button" className="gap-2 bg-blue-600 hover:bg-blue-700">
            <FaDownload />
            Download
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-5 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <h2 className="text-3xl font-bold text-blue-600">
          DOCC
          <span className="text-cyan-500">URE</span>
        </h2>

        <div className="text-xs text-slate-600 sm:text-right">
          <p>
            <span className="font-semibold">Invoice No:</span> {invoiceNo}
          </p>

          <p className="mt-1">
            <span className="font-semibold">Issued:</span> {issuedDate}
          </p>
        </div>
      </div>
    </>
  );
}
