import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'MediRoute AI — Умная маршрутизация пациентов',
  description:
    'MediRoute AI — современная платформа для интеллектуальной маршрутизации пациентов, подбора клиник и реабилитационных центров в Казахстане.',
  keywords: ['медицина', 'клиники', 'реабилитация', 'Шымкент', 'маршрутизация пациентов', 'AI'],
  authors: [{ name: 'MediRoute AI' }],
  robots: 'index, follow',
  openGraph: {
    title: 'MediRoute AI — Умная маршрутизация пациентов',
    description: 'Найдите нужную клинику и составьте маршрут лечения с помощью AI.',
    type: 'website',
    locale: 'ru_KZ',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={inter.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
