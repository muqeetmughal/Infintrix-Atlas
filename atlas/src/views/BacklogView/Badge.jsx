const Badge = ({ children, className }) => (
  <span
    className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border transition-all ${className}`}
  >
    {children}
  </span>
);

export default Badge;
