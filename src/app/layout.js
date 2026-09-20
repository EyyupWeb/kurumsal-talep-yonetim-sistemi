import "./globals.css";
import AuthProvider from "@/base/authProvider";

export const metadata = {
  title: "ITDesk — IT Destek Talep Sistemi",
  description:
    "Minimalist IT destek talep yönetim paneli. Talep oluşturun, takip edin.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="min-h-screen bg-gray-50 antialiased"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

