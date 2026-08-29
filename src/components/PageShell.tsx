import Navbar from '@/components/Navbar';
import KontakFooter from '@/components/KontakFooter';

export default function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ overflowX: 'hidden', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div style={{ flex: 1 }}>{children}</div>
      <KontakFooter />
    </div>
  );
}