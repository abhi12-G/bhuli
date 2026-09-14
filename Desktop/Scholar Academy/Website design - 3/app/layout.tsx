import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Scholar Academy — Home Tuitions Across Patna",
  description:
    "Verified home tutors for Nursery to Class 10 (CBSE, ICSE, Olympiads). Teachers, join our network. Parents, find the right tutor for your child.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${fraunces.variable} ${inter.variable} font-body bg-parchment text-navy-900`}>
        {children}
      </body>
    </html>
  );
}
