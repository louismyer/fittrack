export default function SectionHeader({ title, subtitle, children }) {
  return (
    <div className="flex items-start justify-between mb-2">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2 mt-1">{children}</div>}
    </div>
  );
}
