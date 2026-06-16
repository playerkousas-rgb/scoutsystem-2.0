import './globals.css';
import TopNav from '@/components/TopNav';
export const metadata = { title:'ScoutSystem 2.0', description:'旅團管理系統 UI 2.0' };
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="zh-Hant"><body><TopNav/><main className="container">{children}</main><footer className="footer">© 2026 SKWSCOUT SYSTEM · ScoutSystem 2.0 UI Prototype</footer></body></html>}
