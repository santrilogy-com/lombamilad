import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import AdminNav from '../AdminNav';
import PageOrnaments from '@/components/PageOrnaments';

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/admin/login');

  return (
    <div style={{ position: 'relative', zIndex: 0, overflow: 'hidden', minHeight: '100vh', background: 'var(--paper)' }}>
      <PageOrnaments />
      <AdminNav email={session.user.email || ''} nama={session.user.name || ''} />
      <div style={{ padding: 'clamp(28px, 4vw, 52px) clamp(20px, 4vw, 64px)', maxWidth: 1240, margin: '0 auto' }}>
        {children}
      </div>
    </div>
  );
}