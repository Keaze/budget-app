import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getCategories, createCategory, updateCategory, deleteCategory } from '../api/categories'
import CategoryForm from '../components/CategoryForm'
import ErrorToast from '../components/ErrorToast'
import { logger } from '../utils/logger'

export default function CategoriesPage() {
  const { t } = useTranslation()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  useEffect(() => { fetchCategories() }, [])

  async function fetchCategories() {
    try {
      const res = await getCategories()
      setCategories(res.data)
    } catch (err) {
      logger.error('Failed to load categories', err)
      setError(t('categories.errorLoad'))
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(data) {
    if (editing) {
      const res = await updateCategory(editing.id, data)
      setCategories(cats => cats.map(c => c.id === editing.id ? res.data : c))
    } else {
      const res = await createCategory(data)
      setCategories(cats => [...cats, res.data])
    }
    setShowForm(false)
    setEditing(null)
  }

  async function handleDelete(id) {
    try {
      await deleteCategory(id)
      setCategories(cats => cats.filter(c => c.id !== id))
    } catch (err) {
      logger.error('Failed to delete category', err)
      if (err.response?.status === 403) {
        setError(t('categories.errorDeleteForbidden'))
      } else {
        setError(err.response?.data?.error ?? t('categories.errorDelete'))
      }
    } finally {
      setDeleteId(null)
    }
  }

  if (loading) {
    return <div className="p-6 text-stone-500 text-sm">{t('categories.loading')}</div>
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-stone-900">{t('categories.title')}</h1>
        <button
          onClick={() => { setEditing(null); setShowForm(true) }}
          className="flex items-center gap-1.5 px-4 py-2 border border-green-600 text-green-600 text-sm font-semibold rounded-lg hover:bg-green-50 transition-colors"
        >
          <Plus size={16} />
          {t('categories.addCategory')}
        </button>
      </div>

      <ErrorToast message={error} onDismiss={() => setError(null)} />

      {categories.length === 0 && (
        <p className="text-sm text-stone-500">{t('categories.empty')}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {categories.map(cat => (
          <div key={cat.id} className="bg-white rounded-xl border border-stone-200 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
              style={{ background: (cat.color ?? '#6b7280') + '1f' }}>
              {cat.icon ?? '📁'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-[14px] font-semibold text-stone-900 truncate">{cat.name}</p>
                {cat.is_default && (
                  <span className="text-[10px] font-semibold bg-stone-100 text-stone-400 px-2 py-0.5 rounded-full">
                    {t('categories.defaultBadge')}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-block w-3 h-3 rounded-full shrink-0" style={{ background: cat.color ?? '#6b7280' }} />
                <span className="text-[11px] text-stone-400 font-mono">{cat.color ?? ''}</span>
              </div>
            </div>
            {!cat.is_default && (
              <div className="flex gap-1 shrink-0">
                <button onClick={() => { setEditing(cat); setShowForm(true) }}
                  className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100"
                  aria-label={`Edit ${cat.name}`}>
                  <Pencil size={14} />
                </button>
                {deleteId === cat.id ? (
                  <span className="flex items-center gap-1 text-sm">
                    <span className="text-stone-500 text-xs">{t('common.deletePrompt')}</span>
                    <button onClick={() => handleDelete(cat.id)} className="text-red-600 font-medium text-xs">{t('common.confirmYes')}</button>
                    <button onClick={() => setDeleteId(null)} className="text-stone-500 text-xs">{t('common.confirmNo')}</button>
                  </span>
                ) : (
                  <button onClick={() => setDeleteId(cat.id)}
                    className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-stone-100"
                    aria-label={`Delete ${cat.name}`}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {showForm && (
        <CategoryForm category={editing} onSave={handleSave} onClose={() => { setShowForm(false); setEditing(null) }} />
      )}
    </div>
  )
}
