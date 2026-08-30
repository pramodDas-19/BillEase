import { redirect } from "next/navigation";

export default async function EditQuotationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Redirects or renders editor initialized with quote data
  redirect(`/quotations/${id}`);
}
