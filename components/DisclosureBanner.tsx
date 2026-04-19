import { AlertTriangle } from "lucide-react";

interface DisclosureBannerProps {
  message: string;
  variant?: "warning" | "info";
}

export function DisclosureBanner({ message, variant = "warning" }: DisclosureBannerProps) {
  const styles =
    variant === "warning"
      ? "bg-amber-50 border-amber-200 text-amber-800"
      : "bg-blue-50 border-blue-200 text-blue-800";

  return (
    <div className={`flex gap-3 rounded-lg border p-4 text-sm ${styles}`}>
      <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
      <p>{message}</p>
    </div>
  );
}
