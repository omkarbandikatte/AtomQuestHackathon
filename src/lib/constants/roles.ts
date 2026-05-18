export const ROLES = {
  EMPLOYEE: "employee",
  MANAGER: "manager",
  ADMIN: "admin",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<Role, string> = {
  employee: "Employee",
  manager: "Manager (L1)",
  admin: "Admin / HR",
};
