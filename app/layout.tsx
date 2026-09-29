import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Draftwell | DOCX editor",
  description: "Create, edit, and organize Word documents in your browser.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0, interactive-widget=resizes-content"
      />
      <body>{children}</body>
    </html>
  );
}
