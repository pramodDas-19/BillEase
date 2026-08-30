"use client";

import React, { useState } from "react";
import { Invoice, PaymentMethod } from "@/types";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PAYMENT_METHODS } from "@/constants/payment-methods";
import { formatCurrency } from "@/lib/utils";

interface PaymentRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  onSuccess?: () => void;
}

export function PaymentRecordModal({
  isOpen,
  onClose,
  invoice,
  onSuccess,
}: PaymentRecordModalProps) {
  const [amount, setAmount] = useState(invoice.balanceDue.toString());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // In production, calls PaymentService / API
      setTimeout(() => {
        setIsLoading(false);
        if (onSuccess) onSuccess();
        onClose();
      }, 500);
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Record Payment for ${invoice.invoiceNumber}`}
      description={`Client: ${invoice.clientName} | Balance Due: ${formatCurrency(
        invoice.balanceDue,
        invoice.currency
      )}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <Input
          label="Payment Amount Received"
          type="number"
          step="any"
          max={invoice.balanceDue}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-700">Payment Method</label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
          >
            {PAYMENT_METHODS.map((pm) => (
              <option key={pm.value} value={pm.value}>
                {pm.label}
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Payment Date"
          type="date"
          value={paymentDate}
          onChange={(e) => setPaymentDate(e.target.value)}
          required
        />

        <Input
          label="Transaction Reference / Cheque No / UPI Ref"
          placeholder="e.g. UPI-1234567890 or Chq #4401"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
        />

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-700">Notes (Optional)</label>
          <textarea
            rows={2}
            placeholder="Payment remarks or bank branch info..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Confirm Payment
          </Button>
        </div>
      </form>
    </Modal>
  );
}
