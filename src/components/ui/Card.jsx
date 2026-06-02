export default function Card({ children, className = '', ...rest }) {
  return (
    <div className={`bg-white dark:bg-slate-900 rounded-xl shadow-sm dark:shadow-none border border-gray-100 dark:border-slate-800 ${className}`} {...rest}>
      {children}
    </div>
  );
}
