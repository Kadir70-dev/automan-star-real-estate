import type {Metadata} from 'next';
import CMSAdmin from '@/components/CMSAdmin';
export const metadata:Metadata={title:'Content Studio',robots:{index:false,follow:false}};
export default function Page(){return <CMSAdmin/>;}
