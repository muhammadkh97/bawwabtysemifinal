import AdminSidebar from '@/components/AdminSidebar'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-gray-50" dir="rtl">
      <AdminSidebar />
      <main className="flex-1 mr-64 p-8">
        {children}
      </main>
    </div>
  )
}

