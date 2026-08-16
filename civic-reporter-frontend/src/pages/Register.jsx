import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await register(form.name, form.email, form.password);
      if (data?.isVerified === false) {
        navigate("/", { state: { justRegistered: true } });
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-5 py-16 md:py-24">
      <span className="eyebrow mb-3 block">Join the register</span>
      <h1 className="font-display font-bold text-4xl mb-8">Create an account</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="eyebrow mb-2 block">Full name</label>
          <input
            type="text"
            required
            className="input-field"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Priya Kumar"
          />
        </div>
        <div>
          <label className="eyebrow mb-2 block">Email</label>
          <input
            type="email"
            required
            className="input-field"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="eyebrow mb-2 block">Password</label>
          <input
            type="password"
            required
            minLength={6}
            className="input-field"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="At least 6 characters"
          />
        </div>

        {error && (
          <p className="font-body text-sm text-hazard-dark bg-hazard-light rounded-2xl px-4 py-3">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn-primary mt-2 disabled:opacity-50">
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="text-sm text-ink/60 mt-6">
        Already registered?{" "}
        <Link to="/login" className="text-ink font-semibold underline underline-offset-2">
          Log in
        </Link>
      </p>
    </div>
  );
};

export default Register;
