import { type LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatCardProps = {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  variant?: "default" | "gradient";
  delay?: number;
  className?: string;
};

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  variant = "default",
  delay,
  className,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "transition-shadow hover:shadow-md",
        variant === "gradient" && "overflow-hidden",
        className
      )}
      style={delay ? { animationDelay: `${delay}s` } : undefined}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-background/80">
            <Icon className="h-4 w-4" />
          </div>
        ) : null}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        {description ? (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
