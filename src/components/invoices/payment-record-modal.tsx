"use client";

import React, { useState } from "react";
import { Invoice, PaymentMethod } from "@/types";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PAYMENT_METHODS } from "@/constants/payment-methods";
import { formatCurrency } from "@/lib/utils";
import { PaymentService } from "@/services/payment.service";
import { validatePayment } from "@/validations/payment.schema";
import { AlertCircle } from "lucide-react";

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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setServerError(null);

    const parsedAmount = parseFloat(amount);
    const formErrors = validatePayment(
      {
        invoiceId: invoice.id,
        amount: parsedAmount,
        paymentDate,
        paymentMethod,
        transactionReference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
      },
      invoice.balanceDue
    );

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setIsLoading(true);

    try {
      const payNum = `PAY-${Date.now().toString().slice(-4)}`;
      const result = await PaymentService.createPayment({
        paymentNumber: payNum,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        clientId: invoice.clientId,
        clientName: invoice.clientName,
        amount: parsedAmount,
        currency: invoice.currency || "INR",
        paymentDate,
        paymentMethod,
        transactionReference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      if (!result) {
        throw new Error("Unable to record payment receipt. Please check connection and try again.");
      }

      setIsLoading(false);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error("PaymentRecordModal handleSubmit error:", err);
      setServerError(err.message || "Failed to record payment receipt. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Record Payment for #${invoice.invoiceNumber}`}
      description={`Client: ${invoice.clientName} | Current Due: ${formatCurrency(
        invoice.balanceDue,
        invoice.currency
      )}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {serverError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{serverError}</span>
          </div>
        )}

        <div>
          <Input
            label="Payment Amount Received"
            type="number"
            step="any"
            max={invoice.balanceDue}
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              if (errors.amount) setErrors((prev) => ({ ...prev, amount: "" }));
            }}
            required
          />
          {errors.amount && (
            <p className="text-[11px] text-rose-600 font-semibold mt-1">{errors.amount}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-700">Payment Method</label>
          <select
            value={paymentMethod}
            onChange={(e) => {
              setPaymentMethod(e.target.value as PaymentMethod);
              if (errors.paymentMethod) setErrors((prev) => ({ ...prev, paymentMethod: "" }));
            }}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none min-h-[42px]"
          >
            {PAYMENT_METHODS.map((pm) => (
              <option key={pm.value} value={pm.value}>
                {pm.label}
              </option>
            ))}
          </select>
          {errors.paymentMethod && (
            <p className="text-[11px] text-rose-600 font-semibold mt-1">{errors.paymentMethod}</p>
          )}
        </div>

        <div>
          <Input
            label="Payment Date"
            type="date"
            value={paymentDate}
            onChange={(e) => {
              setPaymentDate(e.target.value);
              if (errors.paymentDate) setErrors((prev) => ({ ...prev, paymentDate: "" }));
            }}
            required
          />
          {errors.paymentDate && (
            <p className="text-[11px] text-rose-600 font-semibold mt-1">{errors.paymentDate}</p>
          )}
        </div>

        <div>
          <Input
            label="Transaction Reference / Cheque No / UPI Ref"
            placeholder="e.g. UPI-1234567890 or Chq #4401"
            value={reference}
            onChange={(e) => {
              setReference(e.target.value);
              if (errors.transactionReference) setErrors((prev) => ({ ...prev, transactionReference: "" }));
            }}
          />
          {errors.transactionReference && (
            <p className="text-[11px] text-rose-600 font-semibold mt-1">{errors.transactionReference}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-700">Notes (Optional)</label>
          <textarea
            rows={2}
            placeholder="Payment remarks or bank branch info..."
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              if (errors.notes) setErrors((prev) => ({ ...prev, notes: "" }));
            }}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none resize-none"
          />
          {errors.notes && (
            <p className="text-[11px] text-rose-600 font-semibold mt-1">{errors.notes}</p>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} className="min-h-[38px] px-4 cursor-pointer">
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading} className="min-h-[38px] px-5 cursor-pointer">
            Confirm Payment
          </Button>
        </div>
      </form>
    </Modal>
  );
}
