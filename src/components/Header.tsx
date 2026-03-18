import Link from 'next/link';

interface HeaderProps {
  userName: string;
  userRole: string;
  expiringDocsCount?: number;
}

export default function Header({ userName, userRole, expiringDocsCount = 0 }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div />
      <div className="flex items-center gap-4">
        {expiringDocsCount > 0 && (
          <Link href="/dashboard/documents" className="relative">
            <span className="text-xl">🔔</span>
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {expiringDocsCount > 9 ? '9+' : expiringDocsCount}
            </span>
          </Link>
        )}
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-800">{userName}</p>
          <p className="text-xs text-gray-500">{userRole}</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">
          {userName.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
