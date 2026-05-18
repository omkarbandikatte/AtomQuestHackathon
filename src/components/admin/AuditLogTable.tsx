"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import type { AuditLogEntry } from "@/types/app.types";
import { formatDateTime } from "@/lib/utils/format";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { exportToCSV, exportToExcel } from "@/lib/utils/export";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface ExtendedEntry extends AuditLogEntry {
  actor?: { full_name: string; email: string } | null;
  goal_sheet?: { id: string; employee?: { full_name: string } | null } | null;
}

interface AuditLogTableProps {
  entries: ExtendedEntry[];
  className?: string;
}

const ACTION_COLORS: Record<string, string> = {
  UNLOCK: "bg-brand-amber/10 text-brand-amber",
  GOAL_EDIT: "bg-brand-blue/10 text-brand-blue",
  APPROVE: "bg-brand-green/10 text-brand-green",
  RETURN: "bg-brand-red/10 text-brand-red",
  SUBMIT: "bg-neutral-100 text-neutral-600",
  GOAL_ADD: "bg-brand-teal/10 text-brand-teal",
};

const EXPORT_COLUMNS = [
  { header: "Time", key: "changed_at" },
  { header: "Actor", key: "actor_name" },
  { header: "Action", key: "action" },
  { header: "Employee", key: "employee_name" },
  { header: "Field", key: "field_changed" },
  { header: "Old Value", key: "old_value" },
  { header: "New Value", key: "new_value" },
  { header: "Reason", key: "reason" },
];

export function AuditLogTable({ entries, className }: AuditLogTableProps) {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  const filtered = entries.filter((e) => {
    const matchSearch =
      !search ||
      (e.actor?.full_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (e.goal_sheet?.employee?.full_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      e.action.toLowerCase().includes(search.toLowerCase());
    const matchAction = actionFilter === "all" || e.action === actionFilter;
    return matchSearch && matchAction;
  });

  const uniqueActions = Array.from(new Set(entries.map((e) => e.action))).sort();

  function handleExport(format: "xlsx" | "csv") {
    const rows = filtered.map((e) => ({
      changed_at: formatDateTime(e.changed_at),
      actor_name: e.actor?.full_name ?? e.actor_id,
      action: e.action,
      employee_name: e.goal_sheet?.employee?.full_name ?? "—",
      field_changed: e.field_changed ?? "—",
      old_value: e.old_value ?? "—",
      new_value: e.new_value ?? "—",
      reason: e.reason ?? "—",
    }));
    const filename = `AtomQuest_AuditLog_${new Date().toISOString().split("T")[0]}`;
    if (format === "xlsx") {
      exportToExcel(rows as unknown as Record<string, unknown>[], EXPORT_COLUMNS, filename);
    } else {
      exportToCSV(rows as unknown as Record<string, unknown>[], EXPORT_COLUMNS, filename);
    }
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 items-center">
        <Input
          placeholder="Search actor, employee, action…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs text-sm h-8"
        />
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-36 h-8 text-sm">
            <SelectValue placeholder="All actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            {uniqueActions.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-neutral-400 ml-auto">
          {filtered.length} entries
        </span>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1"
          onClick={() => handleExport("xlsx")}
        >
          <Download className="h-3 w-3" />
          Excel
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1"
          onClick={() => handleExport("csv")}
        >
          <Download className="h-3 w-3" />
          CSV
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-200">
        <table className="min-w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Time</th>
              <th className="px-4 py-3 text-left font-medium">Actor</th>
              <th className="px-4 py-3 text-left font-medium">Action</th>
              <th className="px-4 py-3 text-left font-medium">Employee</th>
              <th className="px-4 py-3 text-left font-medium">Field</th>
              <th className="px-4 py-3 text-left font-medium">Old Value</th>
              <th className="px-4 py-3 text-left font-medium">New Value</th>
              <th className="px-4 py-3 text-left font-medium">Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 bg-white">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-neutral-500">
                  No audit entries found.
                </td>
              </tr>
            ) : (
              filtered.map((entry) => (
                <tr key={entry.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-neutral-500">
                    {formatDateTime(entry.changed_at)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {entry.actor?.full_name ?? entry.actor_id}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded px-2 py-0.5 text-xs font-semibold",
                        ACTION_COLORS[entry.action] ?? "bg-neutral-100 text-neutral-500",
                      )}
                    >
                      {entry.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-600">
                    {entry.goal_sheet?.employee?.full_name ?? "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{entry.field_changed ?? "—"}</td>
                  <td className="px-4 py-3 text-brand-red text-xs max-w-[140px] truncate">
                    {entry.old_value ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-brand-green text-xs max-w-[140px] truncate">
                    {entry.new_value ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-400 max-w-[160px] truncate">
                    {entry.reason ?? "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

