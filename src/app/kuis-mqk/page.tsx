import { Suspense } from 'react';
import KuisMqkClient from './KuisMqkClient';
import PageOrnaments from '@/components/PageOrnaments';

export const metadata = { title: 'Kuis Penyisihan Babak I — MQK' };

export default function KuisMqkPage() {
  return (
    <div style={{ position: 'relative', overflow: 'hidden', minHeight: '100%' }}>
      <PageOrnaments />
      <Suspense fallback={null}>
        <KuisMqkClient />
      </Suspense>
    </div>
  );
}
