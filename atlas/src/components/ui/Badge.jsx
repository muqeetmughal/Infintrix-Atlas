function Badge({ children, className }) {
  return (
    <span className={`py-0.5 rounded-md text-xs font-bold dark:bg-opacity-20 ${className}`}>
      {children}
    </span>
  );
}
export default Badge;
