import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/components/query-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SWE/Quant/Bus Internship Scraper & Manager for 2024-2025",
  description: "Created by Ritij",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      
        <body className={inter.className}>
          <QueryProvider>
          {children}
          </QueryProvider>
        </body>
        
    </html>
  );
}
