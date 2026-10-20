import type { Metadata } from "next";
import { Geist, Walter_Turncoat } from "next/font/google";
import SmoothScroll from "@/components/layout/SmoothScroll";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const walter = Walter_Turncoat({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-walter",
});

export const metadata: Metadata = {
  title: "Marcus Mdluli | Creative Designer & Software Developer",
  description:
    "Creative designer and software developer building distinctive, high-performance websites and web apps. Available for full-time roles and freelance projects.",
  openGraph: {
    title: "Marcus Mdluli | Creative Designer & Software Developer",
    description: "Design-led web development: UI design, Next.js, React and motion.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${walter.variable}`}>
      <body>
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
