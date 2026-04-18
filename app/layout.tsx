import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pizza Empire — Idle Tycoon",
  description: "Build your pizza empire from a humble stand to a galactic franchise. Click, upgrade, automate, dominate.",
  keywords: ["idle game", "pizza", "clicker", "tycoon", "empire"],
  openGraph: {
    title: "Pizza Empire",
    description: "The most delicious idle game ever made. Start tossing dough.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable}`}>
      <body className="font-body bg-navy text-cream overflow-hidden">
        {children}
      </body>
    </html>
  );
}
