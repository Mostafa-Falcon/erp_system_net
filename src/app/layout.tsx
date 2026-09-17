import type { Metadata } from 'next';
import { Cairo } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { DirectionProvider } from '@radix-ui/react-direction';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ERP Systems | نظام الإدارة والمحاسبة المتكامل',
  description: 'منظومة إدارة الموارد الشاملة - تعمل بدون إنترنت وسحابياً',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={cairo.className} suppressHydrationWarning>
      <body>
        <DirectionProvider dir="rtl">
          {children}
          <Toaster />
        </DirectionProvider>
      </body>
    </html>
  );
}
