import {Suspense} from 'react';import PropertiesClient from '@/components/PropertiesClient';
import {NOINDEX} from '@/lib/seo';
export const metadata={title:'Concept Properties',robots:NOINDEX};
export default function Properties(){return <Suspense fallback={<main className="page-shell container">Loading properties…</main>}><PropertiesClient/></Suspense>}
