import { redirect } from "next/navigation";

export default function LegacyNewCustomerPage() {
  redirect("/customers/new");
}
