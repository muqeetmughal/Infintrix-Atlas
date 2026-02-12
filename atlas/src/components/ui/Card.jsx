const Card = ({ children, title, action, className = "", onClick }) => (
  <div
    className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden ${className}`}
    onClick={onClick}
    role={onClick ? "button" : undefined}
  >
    {(title || action) && (
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 tracking-tight">{title}</h3>
        {action}
      </div>
    )}
    <div className="p-6">{children}</div>
  </div>
);
export default Card;
