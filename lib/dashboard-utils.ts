import { Mail, Link2, MessageCircle, Shield } from "lucide-react";
import React from "react";

export const getRiskColor = (level: string) => {
  switch (level) {
    case "High":
      return "text-red-600 bg-red-50 border border-red-100";
    case "Medium":
      return "text-amber-600 bg-amber-50 border border-amber-100";
    case "Low":
      return "text-emerald-600 bg-emerald-50 border border-emerald-100";
    default:
      return "text-slate-500 bg-slate-50 border border-slate-100";
  }
};

export const getRiskTextColor = (level: string) => {
  switch (level) {
    case "High":
      return "text-red-600";
    case "Medium":
      return "text-amber-600";
    case "Low":
      return "text-emerald-600";
    default:
      return "text-slate-500";
  }
};

export const getTypeIcon = (type: string) => {
  switch (type) {
    case "Email":
      return <Mail className="w-4 h-4" />;
    case "Text":
      return <MessageCircle className="w-4 h-4" />;
    case "URL":
      return <Link2 className="w-4 h-4" />;
    default:
      return <Shield className="w-4 h-4" />;
  }
};

export const getPlanBadge = (plan: string) => {
  switch (plan) {
    case "Free":
      return "bg-slate-100 text-slate-600";
    case "Pro":
      return "bg-blue-100 text-blue-700";
    case "Enterprise":
      return "bg-purple-100 text-purple-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
};