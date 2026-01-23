import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function Page() {
  const c = await cookies();
  const token = c.get("partner_auth")?.value || "";
  if (token) {
    redirect("/dashboard");
  }
  redirect("/auth/sign-in");
}
