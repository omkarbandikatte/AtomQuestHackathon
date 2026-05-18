"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

interface DependencyNode {
  id: string;
  label: string;
  type: "company" | "department" | "employee";
  status?: string;
  children?: DependencyNode[];
}

interface GoalDependencyMapProps {
  data: DependencyNode;
}

function TreeNode({
  node,
  depth = 0,
  isLast = false,
}: {
  node: DependencyNode;
  depth?: number;
  isLast?: boolean;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;

  const nodeColors = {
    company: "bg-brand-blue text-white",
    department: "bg-brand-teal text-white",
    employee: "bg-white border border-neutral-200 text-neutral-900",
  };

  const connectorColor = {
    company: "border-brand-blue",
    department: "border-brand-teal",
    employee: "border-neutral-300",
  };

  return (
    <div className="relative">
      {/* Connector line from parent */}
      {depth > 0 && (
        <div className="absolute -top-3 left-6 w-px h-3 border-l-2 border-dashed border-neutral-300" />
      )}

      <div
        className={cn(
          "relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm cursor-pointer transition-all hover:shadow-md",
          nodeColors[node.type],
          depth > 0 && "ml-8",
        )}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        {hasChildren && (
          <span className="text-xs opacity-70">{expanded ? "▼" : "▶"}</span>
        )}
        <span className="font-medium flex-1">{node.label}</span>
        {node.status && (
          <Badge
            variant="secondary"
            className={cn(
              "text-[10px] px-1.5",
              node.status === "on_track" && "bg-green-100 text-green-800",
              node.status === "at_risk" && "bg-amber-100 text-amber-800",
              node.status === "completed" && "bg-blue-100 text-blue-800",
            )}
          >
            {node.status.replace("_", " ")}
          </Badge>
        )}
      </div>

      {/* Children */}
      {expanded && hasChildren && (
        <div className="relative mt-2 space-y-2">
          {/* Vertical connector */}
          <div
            className={cn(
              "absolute top-0 left-6 w-px border-l-2 border-dashed",
              connectorColor[node.type],
              depth > 0 && "left-14",
            )}
            style={{ height: "calc(100% - 16px)" }}
          />
          {node.children!.map((child, i) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              isLast={i === node.children!.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function GoalDependencyMap({ data }: GoalDependencyMapProps) {
  return (
    <Card className="border-brand-blue/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <svg className="h-4 w-4 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Goal Dependency Map
        </CardTitle>
        <p className="text-xs text-neutral-500">Interactive goal hierarchy — click to expand/collapse</p>
      </CardHeader>
      <CardContent>
        <div className="p-2">
          <TreeNode node={data} />
        </div>
        <div className="flex gap-3 mt-4 pt-3 border-t">
          <div className="flex items-center gap-1 text-xs text-neutral-500">
            <div className="h-2 w-2 rounded bg-brand-blue" /> Company
          </div>
          <div className="flex items-center gap-1 text-xs text-neutral-500">
            <div className="h-2 w-2 rounded bg-brand-teal" /> Department
          </div>
          <div className="flex items-center gap-1 text-xs text-neutral-500">
            <div className="h-2 w-2 rounded border border-neutral-300" /> Individual
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
