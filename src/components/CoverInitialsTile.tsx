import { cn } from "@/lib/utils";

function getInitials(text: string): string {
  const cleaned = text.replace(/[^A-Za-z0-9 ]/g, " ").trim();
  if (!cleaned) return "NG";
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
}

export default function CoverInitialsTile({ title, className }: { title: string; className?: string }) {
  return (
    <div
      className={cn(
        "relative aspect-video rounded-md overflow-hidden",
        "bg-gradient-to-br from-slate-300 via-slate-500 to-slate-800",
        "shadow-[inset_0_2px_8px_rgba(255,255,255,0.35),inset_0_-10px_18px_rgba(0,0,0,0.35),0_12px_20px_rgba(0,0,0,0.25)]",
        className,
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.45),transparent_48%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0)_45%,rgba(0,0,0,0.18)_100%)]" />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-4xl font-black tracking-wider text-white/95 drop-shadow-[0_3px_6px_rgba(0,0,0,0.55)]">
          {getInitials(title)}
        </span>
      </div>
    </div>
  );
}
