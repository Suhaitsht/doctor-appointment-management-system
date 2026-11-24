import React from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import InvoiceHeader from "./InvoiceHeader";
import InvoiceBillingInfo from "./InvoiceBillingInfo";
import InvoiceItemsTable from "./InvoiceItemsTable";
import InvoiceSummary from "./InvoiceSummary";
import InvoiceOtherInfo from "./InvoiceOtherInfo";

export default function InvoicePopup({ open, onOpenChange, invoice }) {
  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto p-0 sm:max-w-[760px]">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>View Invoice</DialogTitle>
        </DialogHeader>

        <div className="p-6">
          <InvoiceHeader
            invoiceNo={invoice.invoiceNo}
            issuedDate={invoice.issuedDate}
          />

          <InvoiceBillingInfo
            billingFrom={invoice.billingFrom}
            billingTo={invoice.billingTo}
            payment={invoice.payment}
          />

          <InvoiceItemsTable items={invoice.items} />

          <InvoiceSummary
            subtotal={invoice.subtotal}
            discount={invoice.discount}
            totalAmount={invoice.totalAmount}
          />

          <InvoiceOtherInfo information={invoice.information} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
