import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token");
  const role = cookieStore.get("user_role")?.value?.toLowerCase();

  if (token?.value) {
    if (role === "admin") {
      redirect("/users");
    }
    if (role === "inventory") {
      redirect("/inventory");
    }
    redirect("/dashboard");
  }
  redirect("/login");
}
