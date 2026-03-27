import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { getCategories, createCategory, updateCategory, deleteCategory } from '../api/categories'
import CategoryForm from '../components/CategoryForm'
import ErrorToast from '../components/ErrorToast'
import { logger } from '../utils/logger'

export default function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  async function fetchCategories() {
    try {
      const res = await getCategories()
      setCategories(res.data)
    } catch (err) {
      logger.error('Failed to load categories', err)
      setError('Failed to load categories.')
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
        setError('Default categories cannot be modified.')
      } else {
        setError(err.response?.data?.error ?? 'Failed to delete category.')
      }
    } finally {
      setDeleteId(null)
    }
  }

  function openCreate() {
    setEditing(null)
    setShowForm(true)
  }

  function openEdit(cat) {
    setEditing(cat)
    setShowForm(true)
  }

  if (loading) {
    return <div className="p-6 text-gray-500 text-sm">Loading categories…</div>
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Categories</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
        >
          <Plus size={16} />
          Add Category
        </button>
      </div>

      <ErrorToast message={error} onDismiss={() => setError(null)} />

      {categories.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No categories yet.
        </p>
      )}

      <ul className="space-y-2">
        {categories.map(cat => (
          <li
            key={cat.id}
            className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md"
          >
            {cat.color && (
              <span
                className="w-4 h-4 rounded-full shrink-0"
                style={{ backgroundColor: cat.color }}
              />
            )}
            {cat.icon && <span className="text-lg leading-none">{cat.icon}</span>}
            <span className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-200">
              {cat.name}
            </span>

            {cat.is_default ? (
              <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full">
                Default
              </span>
            ) : deleteId === cat.id ? (
              <span className="flex items-center gap-2 text-sm">
                <span className="text-gray-500 dark:text-gray-400">Delete?</span>
                <button
                  onClick={() => handleDelete(cat.id)}
                  className="text-red-600 hover:text-red-800 font-medium"
                >
                  Yes
                </button>
                <button
                  onClick={() => setDeleteId(null)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  No
                </button>
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <button
                  onClick={() => openEdit(cat)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded"
                  aria-label="Edit"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => setDeleteId(cat.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                  aria-label="Delete"
                >
                  <Trash2 size={15} />
                </button>
              </span>
            )}
          </li>
        ))}
      </ul>

      {showForm && (
        <CategoryForm
          category={editing}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null) }}
        />
      )}
    </div>
  )
}
