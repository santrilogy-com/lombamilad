import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import AdminNav from '../AdminNav';
import PageOrnaments from '@/components/PageOrnaments';

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/admin/login');

  return (
    <div className="admin-shell" style={{ minHeight: '100vh', background: 'var(--paper)' }}>
      <AdminNav email={session.user.email || ''} nama={session.user.name || ''} />
      <main style={{ flex: 1, minWidth: 0, position: 'relative', zIndex: 0, overflow: 'hidden', padding: 'clamp(24px, 3vw, 40px) clamp(20px, 3vw, 44px)' }}>
        <PageOrnaments />
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>{children}</div>
      </main>
    </div>
  );
}