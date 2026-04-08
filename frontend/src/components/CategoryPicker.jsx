export default function CategoryPicker({ categories, value, onChange, placeholder = '— No category —' }) {
  const selected = categories.find(c => c.id === value)

  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-block w-3 h-3 rounded-full flex-shrink-0 border border-stone-200"
        style={{ backgroundColor: selected?.color ?? 'transparent' }}
        aria-hidden="true"
      />
      <select
        value={value ?? ''}
        onChange={e => onChange(e.target.value || null)}
        className="flex-1 border border-stone-200 rounded-lg px-3 py-2 text-sm bg-stone-50 text-stone-900 focus:outline-none focus:ring-2 focus:ring-green-500"
      >
        <option value="">{placeholder}</option>
        {categories.map(cat => (
          <option key={cat.id} value={cat.id}>
            {cat.icon ? `${cat.icon} ` : ''}{cat.name}
          </option>
        ))}
      </select>
    </div>
  )
}
