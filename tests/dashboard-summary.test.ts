import { describe, it, expect } from "vitest";

// Testing month calculation logic used in SummaryCards
describe("Dashboard Monthly vs All-Time Calculations", () => {
  const isDateInCurrentMonth = (
    dateStr?: string | null,
    targetDate: Date = new Date("2026-09-19T10:00:00Z")
  ): boolean => {
    if (!dateStr) return false;
    const datePart = dateStr.split("T")[0];
    const parts = datePart.split("-");
    if (parts.length >= 2) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      return y === targetDate.getFullYear() && m === targetDate.getMonth();
    }
    const parsed = new Date(dateStr);
    return (
      !isNaN(parsed.getTime()) &&
      parsed.getFullYear() === targetDate.getFullYear() &&
      parsed.getMonth() === targetDate.getMonth()
    );
  };

  it("accurately identifies transactions in the current calendar month", () => {
    const target = new Date("2026-09-19");
    expect(isDateInCurrentMonth("2026-09-01", target)).toBe(true);
    expect(isDateInCurrentMonth("2026-09-19", target)).toBe(true);
    expect(isDateInCurrentMonth("2026-09-30T23:59:59", target)).toBe(true);

    // Prior or future months
    expect(isDateInCurrentMonth("2026-08-31", target)).toBe(false);
    expect(isDateInCurrentMonth("2026-10-01", target)).toBe(false);
    expect(isDateInCurrentMonth("2025-09-15", target)).toBe(false);
    expect(isDateInCurrentMonth(null, target)).toBe(false);
    expect(isDateInCurrentMonth("", target)).toBe(false);
  });

  it("properly separates current month vs lifetime figures", () => {
    const target = new Date("2026-09-19");
    const sampleInvoices = [
      { id: "1", totalAmount: 10000, issueDate: "2026-09-05", paidAmount: 10000, balanceDue: 0 },
      { id: "2", totalAmount: 25000, issueDate: "2026-09-15", paidAmount: 15000, balanceDue: 10000 },
      { id: "3", totalAmount: 40000, issueDate: "2026-08-20", paidAmount: 40000, balanceDue: 0 },
    ];

    const allTimeInvoiced = sampleInvoices.reduce((acc, i) => acc + i.totalAmount, 0);
    const thisMonthInvoiced = sampleInvoices
      .filter((i) => isDateInCurrentMonth(i.issueDate, target))
      .reduce((acc, i) => acc + i.totalAmount, 0);

    expect(allTimeInvoiced).toBe(75000);
    expect(thisMonthInvoiced).toBe(35000); // 10000 + 25000
  });
});
