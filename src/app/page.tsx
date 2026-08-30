import { redirect } from "next/navigation";

export default function HomePage() {
  // Redirect to dashboard by default in app structure
  redirect("/dashboard");
}
