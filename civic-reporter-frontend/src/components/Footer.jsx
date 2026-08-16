const Footer = () => (
  <footer className="border-t border-ink/8 mt-auto bg-white">
    <div className="max-w-6xl mx-auto px-5 md:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-3">
      <p className="font-display font-medium text-sm text-ink/80">
        Civic Reporter — see it, report it, get it fixed.
      </p>
      <p className="font-mono text-[11px] text-steel">
        © {new Date().getFullYear()} Civic Reporter
      </p>
    </div>
  </footer>
);

export default Footer;
