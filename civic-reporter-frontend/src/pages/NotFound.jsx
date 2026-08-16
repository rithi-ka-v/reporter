import { Link } from "react-router-dom";

const NotFound = () => (
  <div className="max-w-2xl mx-auto px-5 py-24 text-center">
    <p className="eyebrow mb-3">Error 404</p>
    <h1 className="font-display font-bold text-5xl mb-4">Nothing logged here</h1>
    <p className="text-ink/60 mb-8">
      This page isn't in the register. It may have moved, or the link's outdated.
    </p>
    <Link to="/" className="btn-primary">
      Back to the feed
    </Link>
  </div>
);

export default NotFound;
