export default function Card({ children, className = '' }) {
  return (
    <div className={`bg-surface dark:bg-slate-900 rounded-lg shadow-card ${className}`}>
      {children}
    </div>
  );
}
