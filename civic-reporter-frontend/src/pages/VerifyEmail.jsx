import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../api/axios";

const VerifyEmail = () => {
  const { token } = useParams();
  const [status, setStatus] = useState("checking"); // checking | success | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    API.get(`/auth/verify/${token}`)
      .then(() => {
        setStatus("success");
        setMessage("Your email is verified.");
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err.response?.data?.message || "This verification link is invalid or expired.");
      });
  }, [token]);

  return (
    <div className="max-w-lg mx-auto px-5 py-24 text-center">
      {status === "checking" && <p className="font-mono text-sm text-steel">Verifying…</p>}

      {status === "success" && (
        <>
          <div className="w-16 h-16 mx-auto mb-6 bg-signal-light flex items-center justify-center rounded-full shadow-soft">
            <span className="text-signal-dark text-2xl">✓</span>
          </div>
          <h1 className="font-display font-bold text-3xl mb-3">Email verified</h1>
          <p className="text-ink/60 text-sm mb-8">{message}</p>
          <Link to="/profile" className="btn-primary">Go to your profile</Link>
        </>
      )}

      {status === "error" && (
        <>
          <h1 className="font-display font-bold text-3xl mb-3">Couldn't verify that</h1>
          <p className="text-ink/60 text-sm mb-8">{message}</p>
          <Link to="/" className="btn-secondary">Back to the feed</Link>
        </>
      )}
    </div>
  );
};

export default VerifyEmail;
