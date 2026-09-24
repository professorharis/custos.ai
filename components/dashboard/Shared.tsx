import { ReactNode } from "react";
import { FileText, Mail, Link2, AlertCircle } from "lucide-react";

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
      {action && <div>{action}</div>}
    </div>
  );
}

export function Avatar({
  name,
  src,
  size = "md",
}: {
  name: string;
  src?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const sizeClasses = { sm: "w-8 h-8 text-xs", md: "w-12 h-12 text-base", lg: "w-16 h-16 text-xl" };

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizeClasses[size]} rounded-full object-cover flex-shrink-0`}
        onError={(e) => {
          // If the image URL fails to load (deleted file, bad URL, etc.),
          // hide it so it doesn't show a broken image icon. The initials
          // version isn't automatically swapped in here since this is a
          // plain <img>, but the src will simply render blank instead of
          // broken — re-saving the profile will refresh it.
          (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
        }}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold flex-shrink-0`}
    >
      {initials}
    </div>
  );
}

export function StatCard({ label, value, icon: Icon, accent }: any) {
  return (
    <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] p-5 border border-slate-100">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accent}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-800 mt-2">{value}</p>
    </div>
  );
}

export function getTypeIcon(type: string) {
  if (type === "Email") return <Mail className="w-4 h-4" />;
  if (type === "URL") return <Link2 className="w-4 h-4" />;
  return <FileText className="w-4 h-4" />;
}

export function getRiskColor(risk: string) {
  if (risk === "High") return "bg-red-100 text-red-600";
  if (risk === "Medium") return "bg-amber-100 text-amber-600";
  return "bg-green-100 text-green-600";
}

export function getRiskTextColor(risk: string) {
  if (risk === "High") return "text-red-600";
  if (risk === "Medium") return "text-amber-600";
  return "text-green-600";
}