import { useQuery } from "@tanstack/react-query";
import { AuditService } from "@/services/audit-service";

export function useAuditLog(sheetId?: string, page = 1, pageSize = 50) {
  return useQuery({
    queryKey: ["audit-log", sheetId, page],
    queryFn: () => AuditService.getAuditLog({ sheetId, page, pageSize }),
  });
}
