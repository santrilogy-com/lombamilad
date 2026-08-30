import { Suspense } from 'react';
import KuisMqkClient from './KuisMqkClient';

export const metadata = { title: 'Kuis Penyisihan Babak I — MQK' };

export default function KuisMqkPage() {
  return (
    <Suspense fallback={null}>
      <KuisMqkClient />
    </Suspense>
  );
}
