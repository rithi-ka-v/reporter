import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import API from "../api/axios";
import IssueCard from "../components/IssueCard";
import { CATEGORIES } from "../constants/categories";
import { useAuth } from "../context/AuthContext";

const FILTERS = [
  { key: "", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "in-progress", label: "In progress" },
  { key: "resolved", label: "Resolved" },
];

const Home = () => {
  const { user } = useAuth();
  const { state } = useLocation();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [stats, setStats] = useState({ total: 0, resolved: 0, emergency: 0 });

  const [nearMe, setNearMe] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const params = {};
      if (status) params.status = status;
      if (category) params.category = category;
      if (sortBy) params.sortBy = sortBy;
      const { data } = await API.get("/issues", { params });
      setIssues(data);

      const { data: all } = await API.get("/issues");
      setStats({
        total: all.length,
        resolved: all.filter((i) => i.status === "resolved").length,
        emergency: all.filter((i) => i.isEmergency && i.status !== "resolved").length,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchNearby = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation isn't supported on this device.");
      return;
    }
    setLocating(true);
    setLocationError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { data } = await API.get("/issues/near", {
            params: { lat: pos.coords.latitude, lng: pos.coords.longitude, radius: 3000 },
          });
          setIssues(data);
          setNearMe(true);
        } catch (err) {
          setLocationError("Couldn't load nearby issues.");
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocationError("Location permission denied — enable it to see issues near you.");
        setLocating(false);
      }
    );
  };

  const exitNearMe = () => {
    setNearMe(false);
    setLocationError("");
    fetchIssues();
  };

  useEffect(() => {
    fetchIssues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, category, sortBy]);

  const handleUpvote = async (id) => {
    if (!user) return;
    try {
      await API.put(`/issues/${id}/upvote`);
      fetchIssues();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      {/* Hero */}
      <section className="bg-white border-b border-ink/8">
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-16 md:py-24">
          <div className="grid md:grid-cols-[1.3fr_1fr] gap-12 items-end">
            <div>
              <span className="eyebrow mb-4 block">Ward reporting, open register</span>
              <h1 className="font-display font-semibold text-[13vw] sm:text-6xl md:text-7xl leading-[0.95] tracking-tight mb-6">
                See it broken.
                <br />
                Log it once.
                <br />
                <span className="text-brand">Track it fixed.</span>
              </h1>
              <p className="text-ink/60 text-base md:text-lg max-w-md mb-8">
                Potholes, dead streetlights, overflowing bins, exposed wiring — pin it on the
                map and the right department is notified directly.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to={user ? "/report" : "/register"} className="btn-primary">
                  Report an issue →
                </Link>
                <Link to="/map" className="btn-secondary">
                  View the map
                </Link>
              </div>
            </div>

            <dl className="grid grid-cols-3 md:grid-cols-1 gap-3 md:gap-3">
              <div className="card-surface p-4 md:p-5">
                <dt className="eyebrow mb-1">Logged</dt>
                <dd className="font-display font-semibold text-3xl md:text-4xl">{stats.total}</dd>
              </div>
              <div className="card-surface p-4 md:p-5">
                <dt className="eyebrow mb-1">Resolved</dt>
                <dd className="font-display font-semibold text-3xl md:text-4xl text-signal-dark">
                  {stats.resolved}
                </dd>
              </div>
              <div className="card-surface p-4 md:p-5">
                <dt className="eyebrow mb-1">Active emergencies</dt>
                <dd className="font-display font-semibold text-3xl md:text-4xl text-hazard-dark">
                  {stats.emergency}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {state?.justRegistered && (
        <div className="max-w-6xl mx-auto px-5 md:px-8 pt-6">
          <p className="font-body text-sm text-signal-dark bg-signal-light rounded-2xl px-4 py-3">
            Account created. Check your email to verify it — verified accounts get more trust on reports.
          </p>
        </div>
      )}

      {/* Feed */}
      <section className="max-w-6xl mx-auto px-5 md:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => {
                  exitNearMe();
                  setStatus(f.key);
                }}
                className={`font-body text-sm font-medium px-4 py-2 rounded-full transition-colors ${
                  status === f.key && !nearMe
                    ? "bg-ink text-white"
                    : "bg-white text-ink/60 border border-ink/10 hover:border-ink/30"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={nearMe ? exitNearMe : fetchNearby}
              disabled={locating}
              className={`font-body text-sm font-medium px-4 py-2 rounded-full transition-colors disabled:opacity-50 ${
                nearMe ? "bg-signal text-white" : "bg-white text-ink/60 border border-ink/10 hover:border-ink/30"
              }`}
            >
              {locating ? "Locating…" : nearMe ? "✓ Near me" : "📍 Near me"}
            </button>
            <select
              value={category}
              onChange={(e) => {
                exitNearMe();
                setCategory(e.target.value);
              }}
              className="font-body text-sm bg-white border border-ink/10 rounded-full px-4 py-2 outline-none text-ink/70"
            >
              <option value="">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              disabled={nearMe}
              className="font-body text-sm bg-white border border-ink/10 rounded-full px-4 py-2 outline-none text-ink/70 disabled:opacity-50"
            >
              <option value="">Newest first</option>
              <option value="upvotes">Most upvoted</option>
            </select>
          </div>
        </div>

        {locationError && (
          <p className="font-body text-sm text-hazard-dark bg-hazard-light rounded-2xl px-4 py-3 mb-6">
            {locationError}
          </p>
        )}
        {nearMe && !locationError && (
          <p className="font-body text-sm text-signal-dark bg-signal-light rounded-2xl px-4 py-3 mb-6">
            Showing issues within 3km of your current location.
          </p>
        )}

        {loading ? (
          <p className="font-mono text-sm text-steel">Loading register…</p>
        ) : issues.length === 0 ? (
          <div className="card-surface border-dashed p-12 text-center">
            <p className="font-display font-semibold text-2xl mb-2">Nothing logged here yet</p>
            <p className="text-ink/60 text-sm">Be the first to flag an issue in this filter.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {issues.map((issue) => (
              <IssueCard
                key={issue._id}
                issue={issue}
                onUpvote={handleUpvote}
                upvoted={issue.upvotes?.includes(user?._id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
