import { STATUS_META } from "../constants/categories";

const colorClasses = {
  hazard: "bg-hazard-light text-hazard-dark",
  route: "bg-route-light text-route-dark",
  signal: "bg-signal-light text-signal-dark",
};

const StatusTag = ({ status, emergency, escalated }) => {
  const meta = STATUS_META[status] || STATUS_META.pending;

  return (
    <div className="flex items-center gap-2 shrink-0 flex-wrap">
      {emergency && (
        <span className="pill bg-brand text-white">
          {escalated ? "⚠ Escalated" : "⚠ Emergency"}
        </span>
      )}
      <span className={`pill ${colorClasses[meta.color]}`}>{meta.label}</span>
    </div>
  );
};

export default StatusTag;
