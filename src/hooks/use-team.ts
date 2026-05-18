import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/use-auth-store";
import { UserService } from "@/services/user-service";

export function useTeam() {
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: ["team", user?.id],
    queryFn: () => UserService.getTeamSummary(user!.id),
    enabled: !!user && (user.role === "manager" || user.role === "admin"),
  });
}

export function useTeamMemberSheet(employeeId: string, cycleId: string) {
  return useQuery({
    queryKey: ["team-member-sheet", employeeId, cycleId],
    queryFn: () => UserService.getTeamMemberSheet(employeeId, cycleId),
    enabled: !!employeeId && !!cycleId,
  });
}
