import type {Metadata} from 'next';
// The team dashboard is private: keep every /dashboard route out of search.
export const metadata:Metadata={title:'Team Dashboard',robots:{index:false,follow:false}};
export default function DashboardLayout({children}:{children:React.ReactNode}){return children}
