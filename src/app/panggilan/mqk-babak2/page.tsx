import { Suspense } from 'react';
import PanggilanClient from '../PanggilanClient';
import PageOrnaments from '@/components/PageOrnaments';

export const metadata = { title: 'Sidang MQK Babak II' };

export default function PanggilanMqkBabak2Page() {
  return (
    <div style={{ position: 'relative', zIndex: 0, overflow: 'hidden', flex: 1 }}>
      <PageOrnaments />
      <Suspense fallback={null}>
        <PanggilanClient ruang="mqk-babak2" judul="Sidang MQK Babak II" />
      </Suspense>
    </div>
  );
}
