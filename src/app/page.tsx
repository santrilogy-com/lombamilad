import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Stats from '@/components/Stats';
import LombaSection from '@/components/LombaSection';
import JadwalSection from '@/components/JadwalSection';
import AlurSection from '@/components/AlurSection';
import HadiahSection from '@/components/HadiahSection';
import CTABanner from '@/components/CTABanner';
import KontakFooter from '@/components/KontakFooter';

export default function HomePage() {
  return (
    <div style={{ overflowX: 'hidden' }}>
      <Navbar />
      <main>
        <Hero />
        <Stats />
        <LombaSection />
        <JadwalSection />
        <AlurSection />
        <HadiahSection />
        <CTABanner />
        <KontakFooter />
      </main>
    </div>
  );
}
