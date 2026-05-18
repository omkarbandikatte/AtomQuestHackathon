import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";

interface Department {
  name: string;
  count: number;
}

interface Props {
  departments: Department[];
}

export function OrgTreeClient({ departments }: Props) {
  const max = departments[0]?.count ?? 1;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-neutral-700 flex items-center gap-1.5">
          <Building2 className="h-4 w-4 text-neutral-400" />
          Departments
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {departments.length === 0 ? (
          <p className="text-xs text-neutral-400 text-center py-4">No departments</p>
        ) : (
          departments.map((dept) => (
            <div key={dept.name}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-neutral-700 truncate max-w-[140px]" title={dept.name}>
                  {dept.name}
                </span>
                <span className="text-neutral-500 font-medium ml-2">{dept.count}</span>
              </div>
              <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className="h-1.5 rounded-full bg-brand-blue/60 transition-all duration-500"
                  style={{ width: `${(dept.count / max) * 100}%` }}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
