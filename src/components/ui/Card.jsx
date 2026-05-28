export default function Card({ children, className = '' }) {
  return (
    <div className={`bg-white dark:bg-slate-900 rounded-xl shadow-sm dark:shadow-none ${className}`}>
      {children}
    </div>
  );
}
