"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createUserAction } from "@/app/actions/admin";
import { userSchema } from "@/validations/admin-schema";
import type { UserFormValues } from "@/validations/admin-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus } from "lucide-react";

interface Manager {
  id: string;
  full_name: string;
}

interface Props {
  managers: Manager[];
}

export function UserFormDialog({ managers }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      role: "employee",
      manager_id: null,
      department: null,
    },
  });

  const roleValue = watch("role");

  function onSubmit(values: UserFormValues) {
    startTransition(async () => {
      const result = await createUserAction(values);
      if (result.error) {
        toast.error(result.error);
      } else {
        const pw = values.password ? "the password you set" : "AtomQuest@123";
        toast.success(`User created. They can sign in with ${pw}.`);
        reset();
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-brand-blue hover:bg-brand-blue/90 gap-1.5">
          <UserPlus className="h-4 w-4" />
          Add User
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="full_name">Full Name</Label>
            <Input id="full_name" placeholder="Jane Smith" {...register("full_name")} />
            {errors.full_name && (
              <p className="text-xs text-brand-red">{errors.full_name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="jane@example.com" {...register("email")} />
            {errors.email && (
              <p className="text-xs text-brand-red">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">
              Password <span className="text-neutral-400 text-xs font-normal">(default: AtomQuest@123)</span>
            </Label>
            <Input id="password" type="password" placeholder="Leave blank for default" {...register("password")} />
            {errors.password && (
              <p className="text-xs text-brand-red">{errors.password.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select
                value={roleValue}
                onValueChange={(v) => setValue("role", v as UserFormValues["role"])}
              >
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
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                placeholder="e.g. Engineering"
                {...register("department")}
              />
            </div>
          </div>

          {roleValue === "employee" && (
            <div className="space-y-1.5">
              <Label>Reports To</Label>
              <Select
                onValueChange={(v) => setValue("manager_id", v === "none" ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No manager</SelectItem>
                  {managers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-brand-blue hover:bg-brand-blue/90"
            >
              {isPending ? "Creating…" : "Create User"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
