import { redirect } from "next/navigation";

export default function RecordPaymentRedirectPage() {
  redirect("/invoices");
}
