import dynamic from 'next/dynamic';
import Loading from './loading';
import { Suspense } from 'react';

const HomePage = dynamic(() => import('./home-page'), {
  loading: () => <Loading />,
  ssr: false,
});

export default function Page() {
  return <Suspense fallback={<Loading />}>
    <HomePage />
  </Suspense>;
}