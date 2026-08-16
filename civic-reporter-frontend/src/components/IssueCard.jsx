import { Link } from "react-router-dom";
import StatusTag from "./StatusTag";
import { categoryLabel } from "../constants/categories";

const ticketId = (id) => `CVC-${id?.slice(-6).toUpperCase() || "000000"}`;

const IssueCard = ({ issue, onUpvote, upvoted }) => {
  const upvoteCount = issue.upvotes?.length || 0;
  const affectedCount = issue.alsoAffectedBy?.length || 0;

  return (
    <div className="card-surface hover:shadow-card transition-shadow duration-200 overflow-hidden">
      <Link to={`/issues/${issue._id}`} className="flex flex-col sm:flex-row gap-4 p-5">
        {issue.photoUrl && (
          <div className="sm:w-32 h-32 sm:h-auto shrink-0 overflow-hidden bg-paper-dim rounded-2xl">
            <img src={issue.photoUrl} alt={issue.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-2">
            <span className="font-mono text-[11px] text-steel tracking-wide">
              {ticketId(issue._id)} · {categoryLabel(issue.category)}
            </span>
            <StatusTag status={issue.status} emergency={issue.isEmergency} escalated={issue.isEscalated} />
          </div>

          <h3 className="font-display font-semibold text-xl leading-tight mb-1.5 truncate">
            {issue.title}
          </h3>

          <p className="text-sm text-ink/70 line-clamp-2 mb-3">{issue.description}</p>

          <div className="flex items-center gap-3 font-mono text-[11px] text-steel">
            <span>📍 {issue.address || "Location pinned"}</span>
            {affectedCount > 0 && <span>· {affectedCount} also affected</span>}
          </div>
        </div>

        <div className="flex sm:flex-col items-center justify-between sm:justify-start sm:items-end gap-2 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onUpvote?.(issue._id);
            }}
            className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl font-mono transition-all ${
              upvoted
                ? "bg-brand text-white shadow-soft"
                : "bg-paper-dim text-ink hover:bg-brand-light hover:text-brand-dark"
            }`}
          >
            <span className="text-base leading-none">▲</span>
            <span className="text-xs font-semibold mt-0.5">{upvoteCount}</span>
          </button>
        </div>
      </Link>
    </div>
  );
};

export default IssueCard;
