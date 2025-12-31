function Badge({ children, className }) {
  return (
    <span className={`py-0.5 rounded-md text-xs font-bold ${className}`}>
      {children}
    </span>
  );
}
export default Badge;