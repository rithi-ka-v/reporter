import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navLinkClass = ({ isActive }) =>
  `font-body text-sm font-medium px-4 py-2 rounded-full transition-colors ${
    isActive ? "bg-brand-light text-brand-dark" : "text-ink/60 hover:text-ink hover:bg-paper-dim"
  }`;

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-ink/8 shadow-soft">
      <div className="max-w-6xl mx-auto px-5 md:px-8 flex items-center justify-between h-16 gap-4">
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <span className="w-9 h-9 bg-brand rounded-xl flex items-center justify-center shadow-soft">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 8.5l4 4 8-9" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="font-display font-semibold text-xl leading-none tracking-tight">
            Civic<span className="text-brand">Reporter</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <NavLink to="/" end className={navLinkClass}>Feed</NavLink>
          <NavLink to="/map" className={navLinkClass}>Map</NavLink>
          {user && <NavLink to="/report" className={navLinkClass}>Report</NavLink>}
          {user && <NavLink to="/my-reports" className={navLinkClass}>My reports</NavLink>}
          {isAdmin && <NavLink to="/admin" className={navLinkClass}>Admin</NavLink>}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          {user ? (
            <>
              <Link
                to="/profile"
                className="hidden sm:flex items-center gap-2 font-body text-sm font-medium text-ink/70 hover:text-ink pl-1 pr-3 py-1 rounded-full hover:bg-paper-dim transition-colors"
              >
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-7 h-7 rounded-full object-cover" />
                ) : (
                  <span className="w-7 h-7 rounded-full bg-brand text-white flex items-center justify-center font-display font-semibold text-xs">
                    {user.name?.charAt(0)?.toUpperCase()}
                  </span>
                )}
                {user.name?.split(" ")[0]}
              </Link>
              <button onClick={handleLogout} className="btn-secondary !px-4 !py-2 !text-xs">
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="font-body text-sm font-medium text-ink/60 hover:text-ink px-3 py-2">
                Log in
              </Link>
              <Link to="/register" className="btn-primary !px-4 !py-2 !text-xs">
                Report an issue
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
