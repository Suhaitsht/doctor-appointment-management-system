import React, { useMemo, useState } from "react";

import InvoiceToolbar from "@/components/Doctor/Invoices/InvoiceToolbar";
import InvoiceTable from "@/components/Doctor/Invoices/InvoiceTable";
import InvoicePopup from "@/components/Doctor/Invoices/InvoicePopup";

import DoctorSidebar from "@/components/Doctor/DoctorSidebar/DoctorSidebar";

const initialInvoices = [
  {
    id: "INV001",
    patient: "Edalin Hendry",
    patientImage: "https://i.pravatar.cc/100?img=12",
    appointmentDate: "24 Mar 2024",
    bookedOn: "21 Mar 2024",
    amount: 300,

    invoiceNo: "#INV005",
    issuedDate: "21 Mar 2024",

    billingFrom: {
      name: "Dr Edalin Hendry",
      address: "806 Twin Willow Lane, New York, USA",
    },

    billingTo: {
      name: "Richard Wilson",
      address: "299 Star Trek Drive, Florida, 32405, USA",
    },

    payment: {
      method: "Debit Card",
      number: "XXXXXXXXXXXX2541",
      bank: "HDFC Bank",
    },

    items: [
      {
        description: "General Consultation",
        quantity: 1,
        vat: 0,
        total: 150,
      },
      {
        description: "Video Call",
        quantity: 1,
        vat: 0,
        total: 100,
      },
    ],

    subtotal: 350,
    discount: 10,
    totalAmount: 315,

    information:
      "An account of the present illness, including the circumstances surrounding the onset of recent health changes.",
  },

  {
    id: "INV002",
    patient: "John Holmes",
    patientImage: "https://i.pravatar.cc/100?img=14",
    appointmentDate: "17 Mar 2024",
    bookedOn: "14 Mar 2024",
    amount: 450,

    invoiceNo: "#INV006",
    issuedDate: "14 Mar 2024",

    billingFrom: {
      name: "Dr Edalin Hendry",
      address: "806 Twin Willow Lane, New York, USA",
    },

    billingTo: {
      name: "John Holmes",
      address: "125 South Street, Chicago, USA",
    },

    payment: {
      method: "Credit Card",
      number: "XXXXXXXXXXXX7452",
      bank: "Commercial Bank",
    },

    items: [
      {
        description: "Consultation",
        quantity: 1,
        vat: 0,
        total: 300,
      },
      {
        description: "Medical Service",
        quantity: 1,
        vat: 0,
        total: 150,
      },
    ],

    subtotal: 450,
    discount: 0,
    totalAmount: 450,

    information: "Patient consultation and medical services.",
  },

  {
    id: "INV003",
    patient: "Shanta Neill",
    patientImage: "https://i.pravatar.cc/100?img=32",
    appointmentDate: "11 Mar 2024",
    bookedOn: "07 Mar 2024",
    amount: 250,

    invoiceNo: "#INV007",
    issuedDate: "07 Mar 2024",

    billingFrom: {
      name: "Dr Edalin Hendry",
      address: "806 Twin Willow Lane, New York, USA",
    },

    billingTo: {
      name: "Shanta Neill",
      address: "21 Park Avenue, Dallas, USA",
    },

    payment: {
      method: "Cash",
      number: "-",
      bank: "-",
    },

    items: [
      {
        description: "General Consultation",
        quantity: 1,
        vat: 0,
        total: 250,
      },
    ],

    subtotal: 250,
    discount: 0,
    totalAmount: 250,

    information: "General consultation payment.",
  },
];

export default function DoctorInvoicesPage() {
  const [invoices] = useState(initialInvoices);

  const [search, setSearch] = useState("");

  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const [invoiceOpen, setInvoiceOpen] = useState(false);

  const filteredInvoices = useMemo(() => {
    const value = search.toLowerCase().trim();

    return invoices.filter((invoice) => {
      return (
        invoice.id.toLowerCase().includes(value) ||
        invoice.patient.toLowerCase().includes(value) ||
        invoice.invoiceNo.toLowerCase().includes(value)
      );
    });
  }, [invoices, search]);

  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setInvoiceOpen(true);
  };

  return (
    <>
      <div className="container mx-auto mt-20 min-h-screen bg-[#f8fafc] text-slate-900">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* SIDEBAR */}
          <aside className="w-full shrink-0 lg:w-[260px]">
            <DoctorSidebar />
          </aside>

          {/* MAIN CONTENT */}
          <main className="min-w-0 flex-1">
            <div className="mx-auto max-w-[1450px] px-4 py-6 md:px-8">
              {/* Heading */}
              <div className="mb-6">
                <div className="mb-2 flex items-center gap-2 text-[10px] text-slate-400">
                  <span>Doctor</span>

                  <span>/</span>

                  <span className="text-blue-600">Invoices</span>
                </div>

                <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
              </div>

              {/* Invoice Section */}
              <div className="rounded-xl bg-white p-5">
                <InvoiceToolbar search={search} setSearch={setSearch} />

                <InvoiceTable
                  invoices={filteredInvoices}
                  onViewInvoice={handleViewInvoice}
                />
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Invoice Popup */}
      <InvoicePopup
        open={invoiceOpen}
        onOpenChange={setInvoiceOpen}
        invoice={selectedInvoice}
      />
    </>
  );
}
