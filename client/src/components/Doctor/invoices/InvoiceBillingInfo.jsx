import React from "react";

export default function InvoiceBillingInfo({
  billingFrom,
  billingTo,
  payment,
}) {
  return (
    <div className="grid gap-6 py-6 md:grid-cols-3">
      <BillingItem
        title="Billing From"
        name={billingFrom.name}
        address={billingFrom.address}
      />

      <BillingItem
        title="Billing To"
        name={billingTo.name}
        address={billingTo.address}
      />

      <div>
        <h3 className="mb-2 text-sm font-semibold text-slate-900">
          Payment Method
        </h3>

        <p className="text-xs text-slate-600">{payment.method}</p>

        <p className="mt-1 text-xs text-slate-500">{payment.number}</p>

        <p className="mt-1 text-xs text-slate-500">{payment.bank}</p>
      </div>
    </div>
  );
}

function BillingItem({ title, name, address }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-slate-900">{title}</h3>

      <p className="text-xs font-medium text-slate-700">{name}</p>

      <p className="mt-1 max-w-[190px] text-xs leading-5 text-slate-500">
        {address}
      </p>
    </div>
  );
}
