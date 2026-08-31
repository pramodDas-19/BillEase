import { redirect } from "next/navigation";

export default function HomePage() {
  // Redirect root visitors directly to the secure login page
  redirect("/login");
}
