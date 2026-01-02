'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { FileText, PlusCircle, Edit, Trash2, Eye, EyeOff, Save, X } from 'lucide-react'

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
  hero_type: 'full' | 'mini'
  title: string
  title_ar: string
  subtitle: string
  subtitle_ar: string
  description: string
  description_ar: string
  background_image: string
  background_color: string
  button_text: string
  button_text_ar: string
  button_link: string
  is_active: boolean
  display_order: number
  page_location: string
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
      console.error('Error loading data:', error)
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
      console.error('Error saving page:', error)
      alert('حدث خطأ أثناء الحفظ')
    }
  }

  const handleSaveHero = async () => {
    if (!editingHero) return

    try {
      const { error } = await supabase
        .from('hero_sections')
        .update({
          hero_type: editingHero.hero_type,
          title: editingHero.title,
          title_ar: editingHero.title_ar,
          subtitle: editingHero.subtitle,
          subtitle_ar: editingHero.subtitle_ar,
          description: editingHero.description,
          description_ar: editingHero.description_ar,
          background_image: editingHero.background_image,
          background_color: editingHero.background_color,
          button_text: editingHero.button_text,
          button_text_ar: editingHero.button_text_ar,
          button_link: editingHero.button_link,
          is_active: editingHero.is_active,
          display_order: editingHero.display_order,
          page_location: editingHero.page_location
        })
        .eq('id', editingHero.id)

      if (error) throw error

      alert('تم حفظ التغييرات بنجاح!')
      setShowModal(false)
      setEditingHero(null)
      loadData()
    } catch (error) {
      console.error('Error saving hero:', error)
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
      console.error('Error toggling status:', error)
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
      console.error('Error toggling status:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">إدارة المحتوى</h1>
        <p className="text-gray-600">تحكم في محتوى الصفحات وأقسام Hero</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('pages')}
          className={`pb-3 px-4 font-semibold transition ${
            activeTab === 'pages'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileText className="w-5 h-5 inline-block ml-2" />
          الصفحات ({pages.length})
        </button>
        <button
          onClick={() => setActiveTab('heroes')}
          className={`pb-3 px-4 font-semibold transition ${
            activeTab === 'heroes'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-500 hover:text-gray-700'
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
              className="bg-white rounded-lg shadow p-6 flex items-center justify-between"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold">{page.title_ar}</h3>
                  <span className="text-sm text-gray-500">/{page.slug}</span>
                  {page.is_active ? (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">نشط</span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">غير نشط</span>
                  )}
                </div>
                <p className="text-gray-600 text-sm">{page.meta_description_ar}</p>
                <p className="text-xs text-gray-400 mt-2">
                  آخر تحديث: {new Date(page.updated_at).toLocaleDateString('ar')}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => togglePageStatus(page)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                  title={page.is_active ? 'إخفاء' : 'إظهار'}
                >
                  {page.is_active ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => {
                    setEditingPage(page)
                    setShowModal(true)
                  }}
                  className="p-2 hover:bg-primary-50 text-primary-600 rounded-lg transition"
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
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-2xl">🎨</span>
              Full Hero Sections (الرئيسي)
            </h2>
            <div className="grid gap-4">
              {heroes.filter(h => h.hero_type === 'full').map((hero) => (
                <div
                  key={hero.id}
                  className="bg-white rounded-lg shadow p-6 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold">{hero.title_ar}</h3>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                        {hero.page_location}
                      </span>
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                        ترتيب: {hero.display_order}
                      </span>
                      {hero.is_active ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">نشط</span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">غير نشط</span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm">{hero.subtitle_ar}</p>
                    <p className="text-gray-500 text-xs mt-1">{hero.description_ar}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleHeroStatus(hero)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition"
                      title={hero.is_active ? 'إخفاء' : 'إظهار'}
                    >
                      {hero.is_active ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => {
                        setEditingHero(hero)
                        setShowModal(true)
                      }}
                      className="p-2 hover:bg-primary-50 text-primary-600 rounded-lg transition"
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
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-2xl">📄</span>
              Mini Hero Sections (رأس الصفحة)
            </h2>
            <div className="grid gap-4">
              {heroes.filter(h => h.hero_type === 'mini').map((hero) => (
                <div
                  key={hero.id}
                  className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg shadow p-6 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold">{hero.title_ar}</h3>
                      <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs">
                        {hero.page_location}
                      </span>
                      {hero.is_active ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">نشط</span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">غير نشط</span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm">{hero.subtitle_ar}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleHeroStatus(hero)}
                      className="p-2 hover:bg-white rounded-lg transition"
                      title={hero.is_active ? 'إخفاء' : 'إظهار'}
                    >
                      {hero.is_active ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => {
                        setEditingHero(hero)
                        setShowModal(true)
                      }}
                      className="p-2 hover:bg-white text-primary-600 rounded-lg transition"
                      title="تعديل"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
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
                  <div>
                    <label className="block font-semibold mb-2">نوع Hero</label>
                    <select
                      value={editingHero.hero_type}
                      onChange={(e) => setEditingHero({ ...editingHero, hero_type: e.target.value as 'full' | 'mini' })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="full">Full Hero (الرئيسي)</option>
                      <option value="mini">Mini Hero (رأس الصفحة)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold mb-2">العنوان بالعربية</label>
                      <input
                        type="text"
                        value={editingHero.title_ar}
                        onChange={(e) => setEditingHero({ ...editingHero, title_ar: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-2">العنوان بالإنجليزية</label>
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
                      <label className="block font-semibold mb-2">العنوان الفرعي بالعربية</label>
                      <input
                        type="text"
                        value={editingHero.subtitle_ar}
                        onChange={(e) => setEditingHero({ ...editingHero, subtitle_ar: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-2">العنوان الفرعي بالإنجليزية</label>
                      <input
                        type="text"
                        value={editingHero.subtitle}
                        onChange={(e) => setEditingHero({ ...editingHero, subtitle: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  {editingHero.hero_type === 'full' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block font-semibold mb-2">الوصف بالعربية</label>
                          <textarea
                            value={editingHero.description_ar}
                            onChange={(e) => setEditingHero({ ...editingHero, description_ar: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold mb-2">الوصف بالإنجليزية</label>
                          <textarea
                            value={editingHero.description}
                            onChange={(e) => setEditingHero({ ...editingHero, description: e.target.value })}
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
                            value={editingHero.button_text_ar}
                            onChange={(e) => setEditingHero({ ...editingHero, button_text_ar: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold mb-2">نص الزر بالإنجليزية</label>
                          <input
                            type="text"
                            value={editingHero.button_text}
                            onChange={(e) => setEditingHero({ ...editingHero, button_text: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold mb-2">رابط الزر</label>
                          <input
                            type="text"
                            value={editingHero.button_link}
                            onChange={(e) => setEditingHero({ ...editingHero, button_link: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                            placeholder="/products"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold mb-2">صورة الخلفية (URL)</label>
                      <input
                        type="text"
                        value={editingHero.background_image}
                        onChange={(e) => setEditingHero({ ...editingHero, background_image: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-2">لون الخلفية</label>
                      <input
                        type="color"
                        value={editingHero.background_color}
                        onChange={(e) => setEditingHero({ ...editingHero, background_color: e.target.value })}
                        className="w-full h-10 px-2 py-1 border rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block font-semibold mb-2">موقع الصفحة</label>
                      <select
                        value={editingHero.page_location}
                        onChange={(e) => setEditingHero({ ...editingHero, page_location: e.target.value })}
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
  )
}
