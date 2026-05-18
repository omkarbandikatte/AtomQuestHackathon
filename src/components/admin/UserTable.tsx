"use client";

import { useState, useTransition } from "react";
import {
  Table, TableHeader, TableHead, TableBody, TableRow, TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils/cn";
import type { User } from "@/types/app.types";
import { ROLE_LABELS } from "@/lib/constants/roles";
import { updateUserAction, deactivateUserAction } from "@/app/actions/admin";
import { toast } from "sonner";
import { Pencil, UserX } from "lucide-react";

interface ExtendedUser extends User {
  manager?: Pick<User, "id" | "full_name"> | null;
}

interface Props {
  users: ExtendedUser[];
}

const roleColors: Record<string, string> = {
  admin: "bg-brand-blue/20 text-brand-blue",
  manager: "bg-brand-teal/20 text-brand-teal",
  employee: "bg-neutral-100 text-neutral-600",
};

export function UserTable({ users }: Props) {
  const [editTarget, setEditTarget] = useState<ExtendedUser | null>(null);
  const [editDept, setEditDept] = useState("");
  const [editRole, setEditRole] = useState<User["role"]>("employee");
  const [editManagerId, setEditManagerId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // filter state
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // derive manager options from users list
  const managerOptions = users.filter(
    (u) => u.role === "manager" || u.role === "admin"
  );

  const filtered = users.filter((u) => {
    const matchSearch =
      !search ||
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  function openEdit(user: ExtendedUser) {
    setEditTarget(user);
    setEditDept(user.department ?? "");
    setEditRole(user.role);
    setEditManagerId(user.manager?.id ?? null);
  }

  function handleSave() {
    if (!editTarget) return;
    startTransition(async () => {
      const result = await updateUserAction(editTarget.id, {
        full_name: editTarget.full_name,
        email: editTarget.email,
        role: editRole,
        department: editDept || null,
        manager_id: editManagerId,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("User updated");
        setEditTarget(null);
      }
    });
  }

  function handleDeactivate(user: ExtendedUser) {
    startTransition(async () => {
      const result = await deactivateUserAction(user.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`${user.full_name} deactivated`);
      }
    });
  }

  return (
    <>
      {/* Filters */}
      <div className="flex gap-3 mb-3">
        <Input
          placeholder="Search name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs text-sm h-8"
        />
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-36 h-8 text-sm">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="employee">Employee</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-neutral-400 self-center ml-auto">
          {filtered.length} of {users.length}
        </span>
      </div>

      <div className="rounded-lg border border-neutral-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-neutral-50">
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Manager</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[90px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-neutral-400 py-8">
                  No users found
                </TableCell>
              </TableRow>
            )}
            {filtered.map((user) => (
              <TableRow key={user.id} className={!user.is_active ? "opacity-50" : ""}>
                <TableCell className="font-medium text-sm">{user.full_name}</TableCell>
                <TableCell className="text-sm text-neutral-500">{user.email}</TableCell>
                <TableCell>
                  <Badge className={cn("text-xs", roleColors[user.role])}>
                    {ROLE_LABELS[user.role]}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-neutral-500">
                  {user.department ?? "—"}
                </TableCell>
                <TableCell className="text-sm text-neutral-500">
                  {user.manager?.full_name ?? "—"}
                </TableCell>
                <TableCell>
                  <Badge
                    className={cn(
                      "text-xs",
                      user.is_active
                        ? "bg-brand-green/20 text-brand-green"
                        : "bg-neutral-100 text-neutral-400",
                    )}
                  >
                    {user.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => openEdit(user)}
                      title="Edit"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    {user.is_active && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-brand-red hover:text-brand-red"
                        onClick={() => handleDeactivate(user)}
                        disabled={isPending}
                        title="Deactivate"
                      >
                        <UserX className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Input
                value={editDept}
                onChange={(e) => setEditDept(e.target.value)}
                placeholder="e.g. Engineering"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={editRole} onValueChange={(v) => setEditRole(v as User["role"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Manager (Reports To)</Label>
              <Select
                value={editManagerId ?? "none"}
                onValueChange={(v) => setEditManagerId(v === "none" ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No manager</SelectItem>
                  {managerOptions
                    .filter((m) => m.id !== editTarget?.id)
                    .map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.full_name} ({m.role})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setEditTarget(null)} disabled={isPending}>
                Cancel
              </Button>
              <Button
                className="bg-brand-blue hover:bg-brand-blue/90"
                onClick={handleSave}
                disabled={isPending}
              >
                {isPending ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

