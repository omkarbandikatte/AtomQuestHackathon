import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";

export default async function HomePage() {
  const user = await getSessionUser();

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  switch (user.role) {
    case "admin":
      redirect(ROUTES.ADMIN_DASHBOARD);
    case "manager":
      redirect(ROUTES.TEAM);
    default:
      redirect(ROUTES.GOAL_SHEET);
  }
}
