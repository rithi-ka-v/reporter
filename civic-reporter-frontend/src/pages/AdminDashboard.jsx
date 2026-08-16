import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";
import StatusTag from "../components/StatusTag";
import { CATEGORIES, categoryLabel } from "../constants/categories";

const ticketId = (id) => `CVC-${id?.slice(-6).toUpperCase() || "000000"}`;

const STATUS_STEPS = ["pending", "in-progress", "resolved"];

const AdminDashboard = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await API.get("/issues/admin/all");
      setIssues(data);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't load the queue.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleStatusChange = async (id, status) => {
    setUpdatingId(id);
    try {
      await API.put(`/issues/${id}/status`, { status });
      await load();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = issues.filter((i) => {
    if (statusFilter && i.status !== statusFilter) return false;
    if (categoryFilter && i.category !== categoryFilter) return false;
    if (emergencyOnly && !i.isEmergency) return false;
    return true;
  });

  const counts = {
    pending: issues.filter((i) => i.status === "pending").length,
    inProgress: issues.filter((i) => i.status === "in-progress").length,
    resolved: issues.filter((i) => i.status === "resolved").length,
    escalated: issues.filter((i) => i.isEscalated).length,
  };

  return (
    <div className="max-w-6xl mx-auto px-5 md:px-8 py-12 md:py-16">
      <span className="eyebrow mb-2 block">Municipal desk</span>
      <h1 className="font-display font-semibold text-4xl mb-8">Admin queue</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        <div className="card-surface p-4">
          <p className="eyebrow mb-1">Pending</p>
          <p className="font-display font-semibold text-3xl text-hazard-dark">{counts.pending}</p>
        </div>
        <div className="card-surface p-4">
          <p className="eyebrow mb-1">In progress</p>
          <p className="font-display font-semibold text-3xl text-route-dark">{counts.inProgress}</p>
        </div>
        <div className="card-surface p-4">
          <p className="eyebrow mb-1">Resolved</p>
          <p className="font-display font-semibold text-3xl text-signal-dark">{counts.resolved}</p>
        </div>
        <div className="card-surface p-4">
          <p className="eyebrow mb-1">Escalated</p>
          <p className="font-display font-semibold text-3xl text-brand">{counts.escalated}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="font-body text-sm bg-white border border-ink/10 rounded-full px-4 py-2 outline-none text-ink/70"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="in-progress">In progress</option>
          <option value="resolved">Resolved</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="font-body text-sm bg-white border border-ink/10 rounded-full px-4 py-2 outline-none text-ink/70"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setEmergencyOnly((v) => !v)}
          className={`font-body text-sm font-medium px-4 py-2 rounded-full transition-colors ${
            emergencyOnly ? "bg-brand text-white" : "bg-white text-ink/60 border border-ink/10 hover:border-ink/30"
          }`}
        >
          Emergencies only
        </button>
      </div>

      {error && (
        <p className="font-body text-sm text-hazard-dark bg-hazard-light rounded-2xl px-4 py-3 mb-6">
          {error}
        </p>
      )}

      {loading ? (
        <p className="font-mono text-sm text-steel">Loading queue…</p>
      ) : filtered.length === 0 ? (
        <div className="card-surface border-dashed p-12 text-center">
          <p className="font-display font-semibold text-2xl mb-2">Queue is clear</p>
          <p className="text-ink/60 text-sm">Nothing matches this filter right now.</p>
        </div>
      ) : (
        <div className="card-surface overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="border-b border-ink/8 text-left">
                <th className="eyebrow font-normal px-4 py-4">Ticket</th>
                <th className="eyebrow font-normal px-4 py-4">Issue</th>
                <th className="eyebrow font-normal px-4 py-4">Reported by</th>
                <th className="eyebrow font-normal px-4 py-4">Status</th>
                <th className="eyebrow font-normal px-4 py-4">Update</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((issue) => (
                <tr key={issue._id} className="border-b border-ink/6 last:border-b-0 align-top hover:bg-paper/60">
                  <td className="px-4 py-4 font-mono text-xs text-steel whitespace-nowrap">
                    {ticketId(issue._id)}
                  </td>
                  <td className="px-4 py-4 max-w-xs">
                    <Link to={`/issues/${issue._id}`} className="font-semibold hover:text-brand">
                      {issue.title}
                    </Link>
                    <p className="text-xs text-ink/50 mt-0.5">
                      {categoryLabel(issue.category)} · {issue.address || "No address given"}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-xs text-ink/70 whitespace-nowrap">
                    {issue.reportedBy?.name || "Unknown"}
                  </td>
                  <td className="px-4 py-4">
                    <StatusTag status={issue.status} emergency={issue.isEmergency} escalated={issue.isEscalated} />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex gap-1.5 flex-wrap">
                      {STATUS_STEPS.map((s) => (
                        <button
                          key={s}
                          onClick={() => handleStatusChange(issue._id, s)}
                          disabled={updatingId === issue._id || issue.status === s}
                          className="font-mono text-[10px] uppercase tracking-wide px-2.5 py-1.5 rounded-full border border-ink/15 hover:border-brand hover:text-brand disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          {s.replace("-", " ")}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
