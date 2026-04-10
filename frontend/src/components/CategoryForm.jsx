import { useState } from 'react'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function CategoryForm({ category, onSave, onClose }) {
  const { t } = useTranslation()
  const [name, setName] = useState(category?.name ?? '')
  const [icon, setIcon] = useState(category?.icon ?? '')
  const [color, setColor] = useState(category?.color ?? '#6366f1')
  const [nameError, setNameError] = useState('')
  const [apiError, setApiError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) {
      setNameError(t('validation.nameRequired'))
      return
    }
    setNameError('')
    setApiError('')
    setSaving(true)
    try {
      await onSave({
        name: name.trim(),
        ...(icon.trim() ? { icon: icon.trim() } : {}),
        ...(color ? { color } : {}),
      })
    } catch (err) {
      setApiError(err.response?.data?.error ?? err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200">
          <h2 className="text-lg font-bold text-stone-900">
            {category ? t('categoryForm.titleEdit') : t('categoryForm.titleNew')}
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-stone-100 text-stone-500" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {apiError && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{apiError}</p>
          )}

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-stone-500 mb-1">
              {t('categoryForm.labelName')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setNameError('') }}
              className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-[13px] bg-stone-50 text-stone-900 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g. Groceries"
            />
            {nameError && <p className="mt-1 text-xs text-red-600">{nameError}</p>}
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-stone-500 mb-1">
              {t('categoryForm.labelIcon')} <span className="text-stone-400 font-normal">{t('categoryForm.iconOptional')}</span>
            </label>
            <input
              type="text"
              value={icon}
              onChange={e => setIcon(e.target.value)}
              className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-[13px] bg-stone-50 text-stone-900 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="🛒"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-stone-500 mb-1">
              {t('categoryForm.labelColor')} <span className="text-stone-400 font-normal">{t('categoryForm.colorOptional')}</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                className="w-10 h-9 rounded cursor-pointer border border-stone-200"
              />
              <span className="text-sm text-stone-500 font-mono">{color}</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-stone-600 border border-stone-200 rounded-md hover:bg-stone-50">
              {t('common.cancel')}
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2.5 bg-green-600 text-white text-[13px] font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50">
              {saving ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
