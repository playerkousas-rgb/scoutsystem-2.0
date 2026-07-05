import './globals.css';
import TopNav from '@/components/TopNav';
export const metadata = { title:'2026 Scout System', description:'旅團管理系統 UI' };
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="zh-Hant"><body><TopNav/><main className="container">{children}</main><footer className="footer">© 2026 Scout System</footer></body></html>}
