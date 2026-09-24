'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navigation() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: '地图查看' },
    { href: '/route', label: '路线编辑' },
    { href: '/editor', label: '数据编辑' },
  ];

  return (
    <nav className="flex gap-2">
      {links.map(link => (
        <Link
          key={link.href}
          href={link.href}
          className={`
            px-4 py-2 rounded text-sm transition-colors
            ${pathname === link.href
              ? 'bg-[#2fe0a4]/10 border border-[#2fe0a4]/40 text-[#63f2c1]'
              : 'bg-[#141817] border border-[#333a37] text-[#9faba6] hover:border-[#414a46]'
            }
          `}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
