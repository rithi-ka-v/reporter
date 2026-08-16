import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "../lib/leafletSetup";
import API from "../api/axios";
import StatusTag from "../components/StatusTag";
import { categoryLabel } from "../constants/categories";
import { useAuth } from "../context/AuthContext";

const STATUS_STEPS = ["pending", "in-progress", "resolved"];

const Avatar = ({ person }) => {
  const initial = person?.name?.charAt(0)?.toUpperCase() || "?";
  if (person?.avatarUrl) {
    return (
      <img
        src={person.avatarUrl}
        alt={person.name}
        className="w-8 h-8 rounded-full object-cover border border-ink/15 shrink-0"
      />
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center font-display font-semibold text-xs shrink-0">
      {initial}
    </div>
  );
};

const IssueDetail = () => {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [updating, setUpdating] = useState(false);
  const [showUpvoters, setShowUpvoters] = useState(false);

  const [commentText, setCommentText] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [commentError, setCommentError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await API.get(`/issues/${id}`);
      setIssue(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleUpvote = async () => {
    if (!user) return;
    await API.put(`/issues/${id}/upvote`);
    load();
  };

  const handleStatusChange = async (status) => {
    setUpdating(true);
    try {
      await API.put(`/issues/${id}/status`, { status, note });
      setNote("");
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setPostingComment(true);
    setCommentError("");
    try {
      await API.post(`/issues/${id}/comments`, { text: commentText });
      setCommentText("");
      load();
    } catch (err) {
      setCommentError(err.response?.data?.message || "Couldn't post that comment.");
    } finally {
      setPostingComment(false);
    }
  };

  const handleLikeComment = async (commentId) => {
    if (!user) return;
    try {
      await API.put(`/issues/${id}/comments/${commentId}/like`);
      load();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <p className="max-w-3xl mx-auto px-5 py-16 font-mono text-sm text-steel">Loading…</p>;
  }

  if (!issue) {
    return (
      <div className="max-w-3xl mx-auto px-5 py-16">
        <p className="font-display text-2xl mb-2">Issue not found</p>
        <Link to="/" className="text-signal underline">Back to the feed</Link>
      </div>
    );
  }

  const [lng, lat] = issue.location.coordinates;
  const upvoted = issue.upvotes?.some((u) => u._id === user?._id);

  return (
    <div className="max-w-4xl mx-auto px-5 py-12 md:py-16">
      <Link to="/" className="font-mono text-xs uppercase tracking-widest text-steel hover:text-ink mb-6 inline-block">
        ← Back to feed
      </Link>

      <div className="flex items-start justify-between gap-4 mb-3">
        <span className="font-mono text-xs text-steel">
          CVC-{issue._id.slice(-6).toUpperCase()} · {categoryLabel(issue.category)}
        </span>
        <StatusTag status={issue.status} emergency={issue.isEmergency} escalated={issue.isEscalated} />
      </div>

      <h1 className="font-display font-bold text-3xl md:text-5xl leading-tight mb-4">{issue.title}</h1>
      <p className="text-ink/70 mb-8 max-w-2xl">{issue.description}</p>

      <div className="grid md:grid-cols-2 gap-6 mb-10">
        {issue.photoUrl ? (
          <img src={issue.photoUrl} alt={issue.title} className="w-full h-64 object-cover rounded-3xl shadow-soft" />
        ) : (
          <div className="w-full h-64 rounded-3xl border-2 border-dashed border-ink/15 flex items-center justify-center font-mono text-xs text-steel">
            No photo attached
          </div>
        )}

        <div className="h-64 rounded-3xl overflow-hidden shadow-soft">
          <MapContainer center={[lat, lng]} zoom={16} className="w-full h-full" scrollWheelZoom={false}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
            <Marker position={[lat, lng]}>
              <Popup>{issue.address || issue.title}</Popup>
            </Marker>
          </MapContainer>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-3">
        <button
          onClick={handleUpvote}
          disabled={!user}
          className={`flex items-center gap-2 px-5 py-3 rounded-full font-body text-sm font-medium transition-colors disabled:opacity-40 ${
            upvoted ? "bg-brand text-white shadow-soft" : "bg-white border border-ink/10 hover:border-brand"
          }`}
        >
          ▲ {issue.upvotes?.length || 0} upvotes
        </button>

        {issue.upvotes?.length > 0 && (
          <button
            onClick={() => setShowUpvoters((v) => !v)}
            className="font-body text-sm font-medium underline underline-offset-2 text-steel hover:text-ink"
          >
            {showUpvoters ? "Hide" : "Who upvoted"}
          </button>
        )}

        {issue.alsoAffectedBy?.length > 0 && (
          <span className="font-mono text-xs text-steel">
            {issue.alsoAffectedBy.length} other citizen(s) also affected
          </span>
        )}
        <span className="font-mono text-xs text-steel">
          Reported by {issue.reportedBy?.name || "a citizen"}
        </span>
      </div>

      {showUpvoters && issue.upvotes?.length > 0 && (
        <div className="card-surface p-4 mb-8 flex flex-col gap-3">
          {issue.upvotes.map((person) => (
            <div key={person._id} className="flex items-center gap-3">
              <Avatar person={person} />
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">
                  {person.name}
                  {person.isVerified && <span className="text-signal-dark ml-1" title="Verified">✓</span>}
                </p>
                <p className="font-mono text-[11px] text-steel truncate">
                  {person.ward || person.address || "Location not shared"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Status history */}
      <div className="mb-12">
        <span className="eyebrow mb-4 block">Status history</span>
        <ol className="border-l-2 border-brand-light pl-6 flex flex-col gap-6">
          {issue.statusHistory?.map((h, i) => (
            <li key={i} className="relative">
              <span className="absolute -left-[29px] top-1 w-3 h-3 rounded-full bg-brand" />
              <p className="font-semibold text-sm capitalize">{h.status.replace("-", " ")}</p>
              {h.note && <p className="text-sm text-ink/60">{h.note}</p>}
              <p className="font-mono text-[11px] text-steel mt-0.5">
                {new Date(h.updatedAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ol>
      </div>

      {/* Admin controls */}
      {isAdmin && (
        <div className="card-surface p-6 mb-12">
          <span className="eyebrow mb-3 block">Admin — update status</span>
          <input
            className="input-field mb-3"
            placeholder="Optional note for this update"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="flex gap-2 flex-wrap">
            {STATUS_STEPS.map((s) => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                disabled={updating || issue.status === s}
                className="btn-secondary !text-xs !py-2 disabled:opacity-40"
              >
                Mark {s.replace("-", " ")}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Comments */}
      <div>
        <span className="eyebrow mb-4 block">
          Comments {issue.comments?.length > 0 && `(${issue.comments.length})`}
        </span>

        {user ? (
          <form onSubmit={handlePostComment} className="flex gap-3 mb-8">
            <Avatar person={user} />
            <div className="flex-1">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add information that could help resolve this…"
                rows={2}
                className="input-field resize-none"
              />
              {commentError && <p className="font-mono text-[11px] text-hazard-dark mt-1">{commentError}</p>}
              <button
                type="submit"
                disabled={postingComment || !commentText.trim()}
                className="btn-secondary !text-xs !py-2 mt-2 disabled:opacity-40"
              >
                {postingComment ? "Posting…" : "Post comment"}
              </button>
            </div>
          </form>
        ) : (
          <p className="font-mono text-xs text-steel mb-8">
            <Link to="/login" className="underline">Log in</Link> to leave a comment.
          </p>
        )}

        {issue.comments?.length > 0 ? (
          <div className="flex flex-col gap-6">
            {[...issue.comments].reverse().map((c) => {
              const liked = c.likes?.includes(user?._id);
              return (
                <div key={c._id} className="flex gap-3">
                  <Avatar person={c.postedBy} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <p className="text-sm font-semibold">
                        {c.postedBy?.name || "A citizen"}
                        {c.postedBy?.isVerified && <span className="text-signal ml-1" title="Verified">✓</span>}
                      </p>
                      <p className="font-mono text-[10px] text-steel">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-sm text-ink/80 mt-0.5 mb-1.5">{c.text}</p>
                    <button
                      onClick={() => handleLikeComment(c._id)}
                      disabled={!user}
                      className={`font-mono text-[11px] uppercase tracking-[0.06em] flex items-center gap-1 disabled:opacity-40 ${
                        liked ? "text-hazard-dark" : "text-steel hover:text-ink"
                      }`}
                    >
                      {liked ? "♥" : "♡"} {c.likes?.length || 0}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="font-mono text-xs text-steel">No comments yet.</p>
        )}
      </div>
    </div>
  );
};

export default IssueDetail;
