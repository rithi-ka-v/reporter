import { useState } from "react";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";

const Profile = () => {
  const { user, updateUser } = useAuth();

  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    ward: user?.ward || "",
    address: user?.address || "",
  });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwNotice, setPwNotice] = useState("");

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError("");
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const { data } = await API.put("/auth/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      updateUser({ avatarUrl: data.avatarUrl });
    } catch (err) {
      setAvatarError(err.response?.data?.message || "Couldn't upload that photo.");
    } finally {
      setAvatarUploading(false);
      e.target.value = "";
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setSaving(true);
    try {
      const { data } = await API.put("/auth/profile", form);
      updateUser(data);
      setNotice("Profile updated.");
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't save changes.");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwError("");
    setPwNotice("");
    setPwSaving(true);
    try {
      await API.put("/auth/password", pwForm);
      setPwNotice("Password updated.");
      setPwForm({ currentPassword: "", newPassword: "" });
    } catch (err) {
      setPwError(err.response?.data?.message || "Couldn't update password.");
    } finally {
      setPwSaving(false);
    }
  };

  if (!user) return null;

  const initial = user.name?.charAt(0)?.toUpperCase() || "?";

  return (
    <div className="max-w-2xl mx-auto px-5 py-14 md:py-20">
      <span className="eyebrow mb-3 block">Registered citizen</span>
      <div className="flex items-center gap-4 mb-3">
        <label className="relative group cursor-pointer shrink-0">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-16 h-16 rounded-full object-cover shadow-soft"
            />
          ) : (
            <div className="w-16 h-16 rounded-full flex items-center justify-center font-display font-semibold text-2xl bg-brand text-white shadow-soft">
              {initial}
            </div>
          )}
          <span className="absolute inset-0 rounded-full bg-ink/0 group-hover:bg-ink/40 transition-colors flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 font-mono text-[9px] text-white uppercase tracking-wide text-center px-1">
              {avatarUploading ? "…" : "Change"}
            </span>
          </span>
          <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={avatarUploading} />
        </label>
        <div>
          <h1 className="font-display font-semibold text-3xl leading-tight flex items-center gap-2">
            {user.name}
            {user.isVerified && (
              <span className="text-signal-dark text-lg" title="Verified account">✓</span>
            )}
          </h1>
          <p className="font-mono text-xs text-steel">{user.email}</p>
        </div>
        <span className="ml-auto pill bg-paper-dim text-ink/60">
          {user.role}
        </span>
      </div>

      {avatarError && (
        <p className="font-body text-sm text-hazard-dark bg-hazard-light rounded-2xl px-4 py-3 mb-4">
          {avatarError}
        </p>
      )}

      <div className="flex items-center gap-2 mb-10">
        <span className={`pill ${user.isVerified ? "bg-signal-light text-signal-dark" : "bg-hazard-light text-hazard-dark"}`}>
          {user.isVerified ? "Verified account" : "Email not verified"}
        </span>
        <span className="pill bg-paper-dim text-ink/60">
          Trust score: {user.trustScore ?? 0}
        </span>
      </div>

      {/* Profile details */}
      <div className="card-surface mb-8">
        <div className="flex items-center justify-between border-b border-ink/8 px-6 py-4">
          <h2 className="font-mono text-xs uppercase tracking-[0.12em] text-steel">Profile details</h2>
          {!editing && (
            <button
              onClick={() => {
                setEditing(true);
                setNotice("");
              }}
              className="font-body text-sm font-medium text-brand hover:text-brand-dark"
            >
              Edit
            </button>
          )}
        </div>

        <div className="p-6">
          {editing ? (
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div>
                <label className="eyebrow mb-2 block">Full name</label>
                <input
                  required
                  className="input-field"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="eyebrow mb-2 block">Phone</label>
                <input
                  className="input-field"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 90000 00000"
                />
              </div>
              <div>
                <label className="eyebrow mb-2 block">Ward</label>
                <input
                  className="input-field"
                  value={form.ward}
                  onChange={(e) => setForm({ ...form, ward: e.target.value })}
                  placeholder="RS Puram, Ward 42"
                />
              </div>
              <div>
                <label className="eyebrow mb-2 block">Address</label>
                <input
                  className="input-field"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Door no., street, area"
                />
              </div>

              {error && (
                <p className="font-body text-sm text-hazard-dark bg-hazard-light rounded-2xl px-4 py-3">
                  {error}
                </p>
              )}

              <div className="flex gap-3">
                <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
                  {saving ? "Saving…" : "Save changes"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setForm({
                      name: user.name || "",
                      phone: user.phone || "",
                      ward: user.ward || "",
                      address: user.address || "",
                    });
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <dl className="grid grid-cols-2 gap-y-4 gap-x-4 text-sm">
              <div>
                <dt className="eyebrow mb-1">Phone</dt>
                <dd className="text-ink/80">{user.phone || "—"}</dd>
              </div>
              <div>
                <dt className="eyebrow mb-1">Ward</dt>
                <dd className="text-ink/80">{user.ward || "—"}</dd>
              </div>
              <div className="col-span-2">
                <dt className="eyebrow mb-1">Address</dt>
                <dd className="text-ink/80">{user.address || "—"}</dd>
              </div>
            </dl>
          )}
        </div>
      </div>

      {notice && !editing && (
        <p className="font-body text-sm text-signal-dark bg-signal-light rounded-2xl px-4 py-3 mb-8">
          {notice}
        </p>
      )}

      {/* Password */}
      <div className="card-surface">
        <div className="border-b border-ink/8 px-6 py-4">
          <h2 className="font-mono text-xs uppercase tracking-[0.12em] text-steel">Change password</h2>
        </div>
        <form onSubmit={handlePasswordChange} className="p-6 flex flex-col gap-4">
          <div>
            <label className="eyebrow mb-2 block">Current password</label>
            <input
              required
              type="password"
              className="input-field"
              value={pwForm.currentPassword}
              onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
            />
          </div>
          <div>
            <label className="eyebrow mb-2 block">New password</label>
            <input
              required
              type="password"
              minLength={6}
              className="input-field"
              value={pwForm.newPassword}
              onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
            />
          </div>

          {pwError && (
            <p className="font-body text-sm text-hazard-dark bg-hazard-light rounded-2xl px-4 py-3">
              {pwError}
            </p>
          )}
          {pwNotice && (
            <p className="font-body text-sm text-signal-dark bg-signal-light rounded-2xl px-4 py-3">
              {pwNotice}
            </p>
          )}

          <button type="submit" disabled={pwSaving} className="btn-secondary self-start disabled:opacity-50">
            {pwSaving ? "Updating…" : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
