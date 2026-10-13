import {Suspense} from 'react';import PropertiesClient from '@/components/PropertiesClient';
export const metadata={title:'Explore Properties'};
export default function Properties(){return <Suspense fallback={<main className="page-shell container">Loading properties…</main>}><PropertiesClient/></Suspense>}
