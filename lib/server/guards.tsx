import { redirect } from "next/navigation";
import AccessNotice from "@/components/AccessNotice";
import { SessionUser, canUseSlider, isAdmin } from "@/lib/auth";
import { getSessionUser } from "@/lib/server/session";

// For server layouts: returns the signed-in user, or a page to show instead.
export async function pageGuard(
  need: "slider" | "admin",
  loginNext: string,
): Promise<{ user: SessionUser; notice?: never } | { user?: never; notice: React.ReactNode }> {
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(loginNext)}`);
  if (need === "admin" && !isAdmin(user)) {
    return { notice: <AccessNotice title="Admins only" message="The admin console is only available to admin accounts." /> };
  }
  if (need === "slider" && !canUseSlider(user)) {
    return {
      notice: (
        <AccessNotice
          title="SLIDER isn't on your account"
          message="Your account is set up for TMS, which isn't available yet. Ask an admin to switch your service to Slider."
        />
      ),
    };
  }
  return { user };
}
