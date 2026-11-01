import React from "react";

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: string;
  trend?: {
    value: number;
    isPositiveGood?: boolean;
  };
  color?: string;
}

export const MetricCard = React.memo(function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = "var(--text-primary)"
}: MetricCardProps) {
  const isUp = trend && trend.value >= 0;
  const isGood = trend ? (trend.isPositiveGood !== false ? isUp : !isUp) : true;
  const trendColor = isGood ? "#22c55e" : "#ef4444";

  return (
    <div className="glass-panel" style={{ padding: "1.25rem", borderRadius: "12px", position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
          {title}
        </span>
        {icon && <span style={{ fontSize: "1.2rem" }}>{icon}</span>}
      </div>

      <div style={{ fontSize: "1.75rem", fontWeight: 800, color, marginTop: "0.5rem" }}>
        {value}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem", fontSize: "0.75rem" }}>
        {trend && (
          <span style={{ color: trendColor, fontWeight: 700 }}>
            {isUp ? "↑" : "↓"} {Math.abs(trend.value).toFixed(1)}%
          </span>
        )}
        {subtitle && <span style={{ color: "var(--text-muted)" }}>{subtitle}</span>}
      </div>
    </div>
  );
});

export default MetricCard;
