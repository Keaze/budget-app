export default function CategoryPicker({ categories, value, onChange, placeholder = '— No category —' }) {
  const selected = categories.find(c => c.id === value)

  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-block w-3 h-3 rounded-full flex-shrink-0 border border-gray-200"
        style={{ backgroundColor: selected?.color ?? 'transparent' }}
        aria-hidden="true"
      />
      <select
        value={value ?? ''}
        onChange={e => onChange(e.target.value || null)}
        className="flex-1 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
