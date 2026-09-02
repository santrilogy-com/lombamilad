import { Suspense } from 'react';
import PanggilanClient from '../PanggilanClient';
import PageOrnaments from '@/components/PageOrnaments';

export const metadata = { title: 'Sidang MTQ' };

export default function PanggilanMtqPage() {
  return (
    <div style={{ position: 'relative', zIndex: 0, overflow: 'hidden', flex: 1 }}>
      <PageOrnaments />
      <Suspense fallback={null}>
        <PanggilanClient ruang="mtq" judul="Sidang MTQ — Musabaqoh Tilawatil Qur'an" />
      </Suspense>
    </div>
  );
}
