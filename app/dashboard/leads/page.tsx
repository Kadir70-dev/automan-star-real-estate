import LiveCRM from '@/components/LiveCRM';
export default function Page(){return <main className="p1-admin-main" style={{minHeight:'100vh',padding:'min(7vw,72px)'}}><a href="/dashboard">← Dashboard</a><h1>CRM Leads</h1><LiveCRM kind="leads"/></main>}
