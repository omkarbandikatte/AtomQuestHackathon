import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils/cn";

interface DeptRow {
  dept: string;
  total: number;
  approved: number;
  submitted: number;
  draft: number;
}

interface Props {
  rows: DeptRow[];
}

export function DepartmentReportTable({ rows }: Props) {
  if (rows.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Department Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-neutral-400 text-center py-4">No data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Department Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-neutral-50">
                <TableHead>Department</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Approved</TableHead>
                <TableHead className="text-right">Submitted</TableHead>
                <TableHead className="text-right">Draft / Other</TableHead>
                <TableHead>Approval Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const rate = row.total > 0 ? Math.round((row.approved / row.total) * 100) : 0;
                return (
                  <TableRow key={row.dept}>
                    <TableCell className="font-medium text-sm">{row.dept}</TableCell>
                    <TableCell className="text-right text-sm">{row.total}</TableCell>
                    <TableCell className="text-right">
                      <span className="text-brand-green font-medium text-sm">{row.approved}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-brand-amber font-medium text-sm">{row.submitted}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-neutral-400 text-sm">{row.draft}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-neutral-100 rounded-full max-w-[120px]">
                          <div
                            className={cn(
                              "h-2 rounded-full transition-all duration-500",
                              rate >= 80
                                ? "bg-brand-green"
                                : rate >= 50
                                ? "bg-brand-amber"
                                : "bg-brand-red",
                            )}
                            style={{ width: `${rate}%` }}
                          />
                        </div>
                        <span className="text-xs text-neutral-600 font-medium">{rate}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
