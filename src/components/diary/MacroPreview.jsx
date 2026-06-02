export default function MacroPreview({ macros }) {
  return (
    <div className="grid grid-cols-4 gap-2 bg-background rounded-lg p-3">
      {[
        { label: 'Calories', value: macros.calories, suffix: '' },
        { label: 'Protein', value: macros.protein, suffix: 'g' },
        { label: 'Carbs', value: macros.carbs, suffix: 'g' },
        { label: 'Fat', value: macros.fat, suffix: 'g' },
      ].map(({ label, value, suffix }) => (
        <div key={label} className="text-center">
          <p className="text-lg font-bold text-brand leading-none">
            {value}{suffix && <span className="text-xs font-medium">{suffix}</span>}
          </p>
          <p className="text-[11px] text-secondary mt-1">{label}</p>
        </div>
      ))}
    </div>
  );
}
