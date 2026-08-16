import { useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";
import { CATEGORIES } from "../constants/categories";

const ReportIssue = () => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "pothole",
    address: "",
    isEmergency: false,
  });
  const [coords, setCoords] = useState(null);
  const [locating, setLocating] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(null); // holds { issue, isDuplicate } once posted

  const captureLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation isn't supported on this device. Enter the address manually.");
      return;
    }
    setLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setError("Couldn't get your location. Check permissions and try again.");
        setLocating(false);
      }
    );
  };

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");

    if (!coords) {
      setError("Pin your location before submitting — tap 'Use my current location'.");
      return;
    }

    setLoading(true);
    try {
      const payload = new FormData();
      payload.append("title", form.title);
      payload.append("description", form.description);
      payload.append("category", form.category);
      payload.append("address", form.address);
      payload.append("isEmergency", form.isEmergency);
      payload.append("longitude", coords.lng);
      payload.append("latitude", coords.lat);
      if (photo) payload.append("photo", photo);

      const { data } = await API.post("/issues", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSubmitted({ issue: data.issue, isDuplicate: !!data.isDuplicate });
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't submit the report. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    const ticketId = `CVC-${submitted.issue._id?.slice(-6).toUpperCase() || "000000"}`;
    return (
      <div className="max-w-lg mx-auto px-5 py-20 md:py-28 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-signal-light flex items-center justify-center shadow-soft">
          <svg width="26" height="26" viewBox="0 0 16 16" fill="none">
            <path d="M2 8.5l4 4 8-9" stroke="#0F9C5A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span className="eyebrow mb-2 block">{ticketId}</span>
        <h1 className="font-display font-semibold text-3xl mb-3">Issue submitted successfully</h1>
        <p className="text-ink/60 text-sm mb-8">
          {submitted.isDuplicate
            ? "A similar issue was already logged nearby — you've been added to it, so it now carries more weight."
            : "It's in the register and visible on the map. You'll be notified as its status changes."}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to={`/issues/${submitted.issue._id}`} className="btn-primary">
            View this issue
          </Link>
          <Link to="/my-reports" className="btn-secondary">
            My reports
          </Link>
          <button
            type="button"
            onClick={() => {
              setSubmitted(null);
              setForm({ title: "", description: "", category: "pothole", address: "", isEmergency: false });
              setCoords(null);
              setPhoto(null);
              setPhotoPreview(null);
            }}
            className="font-body text-sm font-medium text-steel hover:text-ink px-2"
          >
            Report another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-5 py-14 md:py-20">
      <span className="eyebrow mb-3 block">New work order</span>
      <h1 className="font-display font-semibold text-4xl mb-2">Report an issue</h1>
      <p className="text-ink/60 text-sm mb-10">
        Be specific — a clear photo and location gets this resolved faster.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Category picker */}
        <div>
          <label className="eyebrow mb-3 block">Category</label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setForm({ ...form, category: c.value })}
                className={`flex flex-col items-center justify-center gap-1 py-3 rounded-2xl text-center transition-colors ${
                  form.category === c.value
                    ? "bg-brand text-white shadow-soft"
                    : "bg-white border border-ink/10 text-ink/70 hover:border-brand"
                }`}
              >
                <span className="text-lg">{c.icon}</span>
                <span className="font-mono text-[9px] uppercase leading-tight">{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="eyebrow mb-2 block">Title</label>
          <input
            required
            className="input-field"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Deep pothole near the RS Puram signal"
          />
        </div>

        <div>
          <label className="eyebrow mb-2 block">Description</label>
          <textarea
            required
            rows={4}
            className="input-field resize-none"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="What's wrong, how big is it, and who's affected?"
          />
        </div>

        <div>
          <label className="eyebrow mb-2 block">Address / landmark (optional)</label>
          <input
            className="input-field"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Near Gandhipuram bus stand"
          />
        </div>

        {/* Location */}
        <div>
          <label className="eyebrow mb-2 block">Location</label>
          <button
            type="button"
            onClick={captureLocation}
            className="btn-secondary w-full justify-center"
          >
            {locating ? "Locating…" : coords ? "✓ Location pinned — retap to refresh" : "📍 Use my current location"}
          </button>
          {coords && (
            <p className="font-mono text-[11px] text-steel mt-2">
              {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
            </p>
          )}
        </div>

        {/* Photo */}
        <div>
          <label className="eyebrow mb-2 block">Photo (optional, strengthens the report)</label>
          <label className="flex items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-ink/15 hover:border-brand bg-white py-8 cursor-pointer transition-colors">
            {photoPreview ? (
              <img src={photoPreview} alt="preview" className="h-24 rounded-2xl object-cover" />
            ) : (
              <span className="font-body text-sm text-steel">
                Tap to attach a photo
              </span>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          </label>
        </div>

        {/* Emergency toggle */}
        <label className="flex items-start gap-3 rounded-3xl bg-hazard-light px-5 py-4 cursor-pointer">
          <input
            type="checkbox"
            className="mt-1 accent-hazard-dark"
            checked={form.isEmergency}
            onChange={(e) => setForm({ ...form, isEmergency: e.target.checked })}
          />
          <span>
            <span className="font-semibold text-sm block text-hazard-dark">
              This is an immediate danger
            </span>
            <span className="text-xs text-ink/70">
              Exposed wiring, deep open pit, structural risk. Flags this for urgent routing and
              auto-escalates if it isn't addressed within 2 hours.
            </span>
          </span>
        </label>

        {error && (
          <p className="font-body text-sm text-hazard-dark bg-hazard-light rounded-2xl px-4 py-3">
            {error}
          </p>
        )}
        {notice && (
          <p className="font-body text-sm text-signal-dark bg-signal-light rounded-2xl px-4 py-3">
            {notice}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
          {loading ? "Submitting…" : "Submit report"}
        </button>
      </form>
    </div>
  );
};

export default ReportIssue;
