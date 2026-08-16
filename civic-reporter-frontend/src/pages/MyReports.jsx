import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";
import IssueCard from "../components/IssueCard";
import { useAuth } from "../context/AuthContext";

const TABS = [
  { key: "reported", label: "Reported by me" },
  { key: "affected", label: "Also affecting me" },
];

const MyReports = () => {
  const { user } = useAuth();
  const [data, setData] = useState({ reported: [], affected: [] });
  const [tab, setTab] = useState("reported");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await API.get("/issues/mine");
      setData(data);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't load your reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleUpvote = async (id) => {
    try {
      await API.put(`/issues/${id}/upvote`);
      load();
    } catch (err) {
      console.error(err);
    }
  };

  const list = data[tab] || [];

  return (
    <div className="max-w-3xl mx-auto px-5 py-14 md:py-20">
      <span className="eyebrow mb-3 block">Your register</span>
      <h1 className="font-display font-semibold text-4xl mb-8">My reports</h1>

      <div className="flex gap-2 mb-8">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`font-body text-sm font-medium px-4 py-2 rounded-full transition-colors ${
              tab === t.key ? "bg-ink text-white" : "bg-white text-ink/60 border border-ink/10 hover:border-ink/30"
            }`}
          >
            {t.label} ({data[t.key]?.length || 0})
          </button>
        ))}
      </div>

      {error && (
        <p className="font-body text-sm text-hazard-dark bg-hazard-light rounded-2xl px-4 py-3 mb-6">
          {error}
        </p>
      )}

      {loading ? (
        <p className="font-mono text-sm text-steel">Loading…</p>
      ) : list.length === 0 ? (
        <div className="card-surface border-dashed p-12 text-center">
          <p className="font-display font-semibold text-2xl mb-2">Nothing here yet</p>
          <p className="text-ink/60 text-sm mb-6">
            {tab === "reported"
              ? "Issues you report will show up here."
              : "If someone reports an issue near one you've already flagged, it'll appear here."}
          </p>
          <Link to="/report" className="btn-primary">
            Report an issue
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {list.map((issue) => (
            <IssueCard
              key={issue._id}
              issue={issue}
              onUpvote={handleUpvote}
              upvoted={issue.upvotes?.includes(user?._id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyReports;
