'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import FuturisticSidebar from '@/components/dashboard/FuturisticSidebar'
import FuturisticNavbar from '@/components/dashboard/FuturisticNavbar'
import { FileText, PlusCircle, Edit, Trash2, Eye, EyeOff, Save, X } from 'lucide-react'
import { logger } from '@/lib/logger'

interface Page {
  id: string
  slug: string
  title: string
  title_ar: string
  content: any
  meta_description: string
  meta_description_ar: string
  is_active: boolean
  updated_at: string
}

interface HeroSection {
  id: string
  title: string
  title_ar?: string
  subtitle?: string
  subtitle_ar?: string
  image_url?: string
  mobile_image_url?: string
  button_text?: string
  button_text_ar?: string
  button_link?: string
  background_color?: string
  text_color?: string
  is_active?: boolean
  display_order?: number
  page?: string
  start_date?: string
  end_date?: string
  created_at?: string
  updated_at?: string
}

export default function PagesManagementPage() {
  const [pages, setPages] = useState<Page[]>([])
  const [heroes, setHeroes] = useState<HeroSection[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'pages' | 'heroes'>('pages')
  const [editingPage, setEditingPage] = useState<Page | null>(null)
  const [editingHero, setEditingHero] = useState<HeroSection | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // تحميل الصفحات
      const { data: pagesData, error: pagesError } = await supabase
        .from('pages')
        .select('*')
        .order('slug')

      if (pagesError) throw pagesError
      setPages(pagesData || [])

      // تحميل Hero sections
      const { data: heroesData, error: heroesError } = await supabase
        .from('hero_sections')
        .select('*')
        .order('display_order')

      if (heroesError) throw heroesError
      setHeroes(heroesData || [])
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Error loading data', { error: errorMessage, component: 'PagesManagementPage' })
    } finally {
      setLoading(false)
    }
  }

  const handleSavePage = async () => {
    if (!editingPage) return

    try {
      const { error } = await supabase
        .from('pages')
        .update({
          title: editingPage.title,
          title_ar: editingPage.title_ar,
          content: editingPage.content,
          meta_description: editingPage.meta_description,
          meta_description_ar: editingPage.meta_description_ar,
          is_active: editingPage.is_active
        })
        .eq('id', editingPage.id)

      if (error) throw error

      alert('تم حفظ التغييرات بنجاح!')
      setShowModal(false)
      setEditingPage(null)
      loadData()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Error saving page', { error: errorMessage, component: 'PagesManagementPage' })
      alert('حدث خطأ أثناء الحفظ')
    }
  }

  const handleSaveHero = async () => {
    if (!editingHero) return

    try {
      const { error } = await supabase
        .from('hero_sections')
        .update({
          title: editingHero.title,
          title_ar: editingHero.title_ar,
          subtitle: editingHero.subtitle,
          subtitle_ar: editingHero.subtitle_ar,
          image_url: editingHero.image_url,
          mobile_image_url: editingHero.mobile_image_url,
          background_color: editingHero.background_color,
          text_color: editingHero.text_color,
          button_text: editingHero.button_text,
          button_text_ar: editingHero.button_text_ar,
          button_link: editingHero.button_link,
          is_active: editingHero.is_active,
          display_order: editingHero.display_order,
          page: editingHero.page
        })
        .eq('id', editingHero.id)

      if (error) throw error

      alert('تم حفظ التغييرات بنجاح!')
      setShowModal(false)
      setEditingHero(null)
      loadData()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error saving hero', { error: errorMessage, component: 'PagesManagementPage' });
      alert('حدث خطأ أثناء الحفظ')
    }
  }

  const togglePageStatus = async (page: Page) => {
    try {
      const { error } = await supabase
        .from('pages')
        .update({ is_active: !page.is_active })
        .eq('id', page.id)

      if (error) throw error
      loadData()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error toggling page status', { error: errorMessage, component: 'PagesManagementPage' });
    }
  }

  const toggleHeroStatus = async (hero: HeroSection) => {
    try {
      const { error } = await supabase
        .from('hero_sections')
        .update({ is_active: !hero.is_active })
        .eq('id', hero.id)

      if (error) throw error
      loadData()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error toggling hero status', { error: errorMessage, component: 'PagesManagementPage' });
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <FuturisticSidebar role="admin" />
        <div className="lg:mr-64">
          <FuturisticNavbar />
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <FuturisticSidebar role="admin" />
      <div className="lg:mr-64">
        <FuturisticNavbar />
        <div className="p-4 lg:p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 text-white">إدارة المحتوى</h1>
            <p className="text-gray-300">تحكم في محتوى الصفحات وأقسام Hero</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b border-purple-500/30">
            <button
              onClick={() => setActiveTab('pages')}
              className={`pb-3 px-4 font-semibold transition ${
                activeTab === 'pages'
                  ? 'border-b-2 border-purple-500 text-purple-400'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <FileText className="w-5 h-5 inline-block ml-2" />
              الصفحات ({pages.length})
            </button>
            <button
              onClick={() => setActiveTab('heroes')}
              className={`pb-3 px-4 font-semibold transition ${
                activeTab === 'heroes'
                  ? 'border-b-2 border-purple-500 text-purple-400'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <PlusCircle className="w-5 h-5 inline-block ml-2" />
              أقسام Hero ({heroes.length})
            </button>
          </div>

          {/* Pages Tab */}
          {activeTab === 'pages' && (
            <div className="grid gap-4">
              {pages.map((page) => (
                <div
                  key={page.id}
                  className="bg-white/10 backdrop-blur-lg rounded-lg border border-purple-500/20 p-6 flex items-center justify-between hover:bg-white/15 transition"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-white">{page.title_ar}</h3>
                      <span className="text-sm text-gray-400">/{page.slug}</span>
                      {page.is_active ? (
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">نشط</span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded text-xs">غير نشط</span>
                      )}
                    </div>
                    <p className="text-gray-300 text-sm">{page.meta_description_ar}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      آخر تحديث: {new Date(page.updated_at).toLocaleDateString('ar')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => togglePageStatus(page)}
                      className="p-2 hover:bg-white/10 rounded-lg transition text-gray-300 hover:text-white"
                      title={page.is_active ? 'إخفاء' : 'إظهار'}
                    >
                      {page.is_active ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => {
                        setEditingPage(page)
                        setShowModal(true)
                      }}
                      className="p-2 hover:bg-purple-500/20 text-purple-400 rounded-lg transition"
                      title="تعديل"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Heroes Tab */}
          {activeTab === 'heroes' && (
            <div className="space-y-6">
              {/* Full Heroes Section */}
              <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
                  <span className="text-2xl">🎨</span>
                  Full Hero Sections (الرئيسي)
                </h2>
                <div className="grid gap-4">
                  {heroes.map((hero) => (
                    <div
                      key={hero.id}
                      className="bg-white/10 backdrop-blur-lg rounded-lg border border-purple-500/20 p-6 flex items-center justify-between hover:bg-white/15 transition"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-white">{hero.title_ar}</h3>
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                            {hero.page || 'home'}
                          </span>
                          <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                            ترتيب: {hero.display_order}
                          </span>
                          {hero.is_active ? (
                            <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">نشط</span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded text-xs">غير نشط</span>
                          )}
                        </div>
                        <p className="text-gray-300 text-sm">{hero.subtitle_ar}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleHeroStatus(hero)}
                          className="p-2 hover:bg-white/10 rounded-lg transition text-gray-300 hover:text-white"
                          title={hero.is_active ? 'إخفاء' : 'إظهار'}
                        >
                          {hero.is_active ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                        </button>
                        <button
                          onClick={() => {
                            setEditingHero(hero)
                            setShowModal(true)
                          }}
                          className="p-2 hover:bg-purple-500/20 text-purple-400 rounded-lg transition"
                          title="تعديل"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mini Heroes Section */}
              <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
                  <span className="text-2xl">📄</span>
                  Hero Sections
                </h2>
                <div className="grid gap-4">
                  {heroes.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">لا توجد أقسام هيرو</p>
                  ) : null}
                </div>
              </div>
            </div>
          )}

      {/* Edit Modal */}
      {showModal && (editingPage || editingHero) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-2xl font-bold">
                {editingPage ? `تعديل صفحة: ${editingPage.title_ar}` : `تعديل Hero: ${editingHero?.title_ar}`}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false)
                  setEditingPage(null)
                  setEditingHero(null)
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {editingPage && (
                <div className="space-y-4">
                  <div>
                    <label className="block font-semibold mb-2">العنوان بالعربية</label>
                    <input
                      type="text"
                      value={editingPage.title_ar}
                      onChange={(e) => setEditingPage({ ...editingPage, title_ar: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-2">الوصف التعريفي (Meta Description)</label>
                    <textarea
                      value={editingPage.meta_description_ar}
                      onChange={(e) => setEditingPage({ ...editingPage, meta_description_ar: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-2">المحتوى (JSON)</label>
                    <textarea
                      value={JSON.stringify(editingPage.content, null, 2)}
                      onChange={(e) => {
                        try {
                          const parsed = JSON.parse(e.target.value)
                          setEditingPage({ ...editingPage, content: parsed })
                        } catch (err) {
                          // Invalid JSON, don't update
                        }
                      }}
                      rows={15}
                      className="w-full px-4 py-2 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-primary-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">يجب أن يكون JSON صحيح</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="page-active"
                      checked={editingPage.is_active}
                      onChange={(e) => setEditingPage({ ...editingPage, is_active: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <label htmlFor="page-active" className="font-semibold">نشط</label>
                  </div>
                </div>
              )}

              {editingHero && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold mb-2">العنوان بالعربية *</label>
                      <input
                        type="text"
                        value={editingHero.title_ar || ''}
                        onChange={(e) => setEditingHero({ ...editingHero, title_ar: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-2">العنوان بالإنجليزية *</label>
                      <input
                        type="text"
                        value={editingHero.title}
                        onChange={(e) => setEditingHero({ ...editingHero, title: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold mb-2">الوصف بالعربية</label>
                      <textarea
                        value={editingHero.subtitle_ar || ''}
                        onChange={(e) => setEditingHero({ ...editingHero, subtitle_ar: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-2">الوصف بالإنجليزية</label>
                      <textarea
                        value={editingHero.subtitle || ''}
                        onChange={(e) => setEditingHero({ ...editingHero, subtitle: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block font-semibold mb-2">نص الزر بالعربية</label>
                      <input
                        type="text"
                        value={editingHero.button_text_ar || ''}
                        onChange={(e) => setEditingHero({ ...editingHero, button_text_ar: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-2">نص الزر بالإنجليزية</label>
                      <input
                        type="text"
                        value={editingHero.button_text || ''}
                        onChange={(e) => setEditingHero({ ...editingHero, button_text: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-2">رابط الزر</label>
                      <input
                        type="text"
                        value={editingHero.button_link || ''}
                        onChange={(e) => setEditingHero({ ...editingHero, button_link: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="/products"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold mb-2">صورة الخلفية (URL)</label>
                      <input
                        type="url"
                        value={editingHero.image_url || ''}
                        onChange={(e) => setEditingHero({ ...editingHero, image_url: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="https://images.unsplash.com/photo-xxx?w=1200"
                      />
                      {editingHero.image_url && (
                        <div className="mt-2 relative h-32 rounded-lg overflow-hidden">
                          <img 
                            src={editingHero.image_url} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x150?text=Invalid+Image';
                            }}
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block font-semibold mb-2">صورة الموبايل (URL)</label>
                      <input
                        type="url"
                        value={editingHero.mobile_image_url || ''}
                        onChange={(e) => setEditingHero({ ...editingHero, mobile_image_url: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="https://images.unsplash.com/photo-xxx?w=800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <label className="block font-semibold mb-2">لون الخلفية</label>
                      <input
                        type="color"
                        value={editingHero.background_color || '#FF6B35'}
                        onChange={(e) => setEditingHero({ ...editingHero, background_color: e.target.value })}
                        className="w-full h-10 px-2 py-1 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-2">لون النص</label>
                      <input
                        type="color"
                        value={editingHero.text_color || '#FFFFFF'}
                        onChange={(e) => setEditingHero({ ...editingHero, text_color: e.target.value })}
                        className="w-full h-10 px-2 py-1 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-2">الترتيب</label>
                      <input
                        type="number"
                        value={editingHero.display_order || 1}
                        onChange={(e) => setEditingHero({ ...editingHero, display_order: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-2">الصفحة</label>
                      <select
                        value={editingHero.page || 'home'}
                        onChange={(e) => setEditingHero({ ...editingHero, page: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="home">الرئيسية</option>
                        <option value="products">المنتجات</option>
                        <option value="vendors">البائعون</option>
                        <option value="deals">العروض</option>
                        <option value="about">من نحن</option>
                        <option value="contact">اتصل بنا</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold mb-2">الترتيب</label>
                      <input
                        type="number"
                        value={editingHero.display_order}
                        onChange={(e) => setEditingHero({ ...editingHero, display_order: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                        min="0"
                      />
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editingHero.is_active}
                          onChange={(e) => setEditingHero({ ...editingHero, is_active: e.target.checked })}
                          className="w-4 h-4"
                        />
                        <span className="font-semibold">نشط</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-6 pt-6 border-t">
                <button
                  onClick={editingPage ? handleSavePage : handleSaveHero}
                  className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-bold flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  حفظ التغييرات
                </button>
                <button
                  onClick={() => {
                    setShowModal(false)
                    setEditingPage(null)
                    setEditingHero(null)
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-bold"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  )
}
