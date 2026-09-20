"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

const ACILIYET_OPTIONS = [
  { value: "Düşük", color: "bg-blue-100 text-blue-700" },
  { value: "Orta", color: "bg-yellow-100 text-yellow-700" },
  { value: "Yüksek", color: "bg-orange-100 text-orange-700" },
  { value: "Kritik", color: "bg-red-100 text-red-700" },
];

const DURUM_BADGES = {
  Açık: "bg-amber-50 text-amber-700 ring-amber-200",
  "Devam Ediyor": "bg-sky-50 text-sky-700 ring-sky-200",
  Çözüldü: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Kapatıldı: "bg-gray-100 text-gray-500 ring-gray-200",
};

const DURUM_DOTS = {
  Açık: "bg-amber-500",
  "Devam Ediyor": "bg-sky-500",
  Çözüldü: "bg-emerald-500",
  Kapatıldı: "bg-gray-400",
};

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function turkishToAscii(str) {
  const map = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u" };
  return str
    .toLowerCase()
    .replace(/[çğıöşü]/g, (ch) => map[ch] || ch)
    .replace(/[^a-z0-9.]/g, "");
}

function generateEmailPreview(name, surname) {
  if (!name.trim() || !surname.trim()) return "";
  return `${turkishToAscii(name.trim())}.${turkishToAscii(surname.trim())}@internationalplus.com`;
}

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sessionTicketIds, setSessionTicketIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDurum, setFilterDurum] = useState("");
  const [filterAciliyet, setFilterAciliyet] = useState("");
  const [form, setForm] = useState({
    kullaniciAd: "",
    konu: "",
    aciliyet: "Orta",
  });
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [employeeForm, setEmployeeForm] = useState({
    name: "",
    surname: "",
    password: "",
  });
  const [employeeSubmitting, setEmployeeSubmitting] = useState(false);

  const showToast = useCallback((message, type = "success") => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const isAdmin = session?.user?.role === "admin";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/giris");
    }
  }, [status, router]);

  // Close mobile menu on route change or resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchTickets = useCallback(async () => {
    try {
      const res = await fetch("/api/tickets");
      const data = await res.json();
      setTickets(data);
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchTickets();
    }
  }, [status, fetchTickets]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.kullaniciAd.trim() || !form.konu.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const created = await res.json();
        setSessionTicketIds((prev) => [...prev, created._id]);
        setForm({ kullaniciAd: "", konu: "", aciliyet: "Orta" });
        await fetchTickets();
        showToast("Talep başarıyla oluşturuldu.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id, durum) => {
    await fetch(`/api/tickets/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ durum }),
    });
    await fetchTickets();
    showToast(`Talep durumu "${durum}" olarak güncellendi.`);
  };

  const handleDelete = async (id) => {
    await fetch(`/api/tickets/${id}`, { method: "DELETE" });
    await fetchTickets();
    showToast("Talep başarıyla silindi.", "warning");
  };

  const handleEmployeeSubmit = async (e) => {
    e.preventDefault();
    if (!employeeForm.name.trim() || !employeeForm.surname.trim() || !employeeForm.password) return;
    setEmployeeSubmitting(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(employeeForm),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Hesap oluşturuldu: ${data.email}`);
        setEmployeeForm({ name: "", surname: "", password: "" });
      } else {
        showToast(data.error || "Hesap oluşturulamadı.", "warning");
      }
    } catch {
      showToast("Bir hata oluştu.", "warning");
    } finally {
      setEmployeeSubmitting(false);
    }
  };

  const emailPreview = generateEmailPreview(employeeForm.name, employeeForm.surname);

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <svg
          className="h-8 w-8 animate-spin text-indigo-500"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      </div>
    );
  }

  const visibleTickets = (isAdmin
    ? tickets
    : tickets.filter((t) => sessionTicketIds.includes(t._id))
  )
    .filter((t) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        t.kullaniciAd?.toLowerCase().includes(q) ||
        t.konu?.toLowerCase().includes(q)
      );
    })
    .filter((t) => (!filterDurum ? true : t.durum === filterDurum))
    .filter((t) => (!filterAciliyet ? true : t.aciliyet === filterAciliyet));

  const openCount = tickets.filter((t) => t.durum === "Açık").length;
  const resolvedCount = tickets.filter((t) => t.durum === "Çözüldü").length;

  return (
    <div className="min-h-screen">
      {/* ===== RESPONSIVE HEADER ===== */}
      <header className="relative z-50 bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 py-3 md:px-6 md:py-5 flex items-center justify-between">
          {/* Logo — always visible */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md shadow-indigo-200">
              <svg className="h-5 w-5 md:h-5.5 md:w-5.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
              </svg>
            </div>
            <div className="min-w-0">
              <h1 className="text-sm md:text-base font-bold text-gray-900 tracking-tight leading-tight truncate">
                Kurumsal Talep Yönetim Sistemi
              </h1>
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">
                KTYS
              </p>
            </div>
          </div>

          {/* Desktop nav items — hidden on mobile */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-1.5 ring-1 ring-amber-200">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-xs font-semibold text-amber-700">
                {openCount} Açık
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-1.5 ring-1 ring-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-semibold text-emerald-700">
                {resolvedCount} Çözüldü
              </span>
            </div>
            <div className="flex items-center gap-3 border-l border-gray-200 pl-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">
                  {session.user.name}
                </p>
                <p className="text-xs text-gray-400">
                  {isAdmin ? "IT Uzmanı" : "Çalışan"}
                </p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/auth/giris" })}
                className="rounded-xl border border-gray-200 px-3.5 py-1.5 text-xs font-semibold text-gray-600 transition-all hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900"
              >
                Çıkış Yap
              </button>
            </div>
          </div>

          {/* Hamburger button — visible on mobile only */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-600 transition-all hover:bg-gray-50 active:scale-95"
            aria-label="Menüyü aç/kapat"
          >
            <svg
              className={`h-5 w-5 transition-transform duration-300 ${mobileMenuOpen ? "rotate-90" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile dropdown menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            mobileMenuOpen
              ? "max-h-80 opacity-100 border-t border-gray-100"
              : "max-h-0 opacity-0"
          }`}
        >
          <div className="px-4 py-4 space-y-3 bg-gray-50/50">
            {/* Badges */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-1.5 ring-1 ring-amber-200">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-xs font-semibold text-amber-700">
                  {openCount} Açık
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-1.5 ring-1 ring-emerald-200">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-semibold text-emerald-700">
                  {resolvedCount} Çözüldü
                </span>
              </div>
            </div>
            {/* User info + logout */}
            <div className="flex items-center justify-between rounded-xl bg-white p-3 ring-1 ring-gray-100">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {session.user.name}
                </p>
                <p className="text-xs text-gray-400">
                  {isAdmin ? "IT Uzmanı" : "Çalışan"}
                </p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/auth/giris" })}
                className="rounded-xl border border-gray-200 px-3.5 py-1.5 text-xs font-semibold text-gray-600 transition-all hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900"
              >
                Çıkış Yap
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ===== MAIN CONTENT ===== */}
      <main className="mx-auto max-w-7xl px-4 py-4 sm:py-6 md:px-6 lg:py-8">
        {/* ===== ADMIN: ADD EMPLOYEE FORM ===== */}
        {isAdmin && (
          <div className="mb-6 md:mb-8 rounded-2xl bg-white p-4 md:p-6 shadow-md ring-1 ring-gray-100">
            <div className="flex items-center gap-3 mb-4 md:mb-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-md shadow-violet-200">
                <svg className="h-4.5 w-4.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Yeni Çalışan Ekle</h2>
                <p className="text-xs text-gray-400">Kurumsal e-posta otomatik oluşturulur</p>
              </div>
            </div>
            <form onSubmit={handleEmployeeSubmit} className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ad</label>
                <input
                  type="text"
                  required
                  value={employeeForm.name}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
                  placeholder="Ahmet"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Soyad</label>
                <input
                  type="text"
                  required
                  value={employeeForm.surname}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, surname: e.target.value })}
                  placeholder="Yılmaz"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Geçici Şifre</label>
                <input
                  type="text"
                  required
                  value={employeeForm.password}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, password: e.target.value })}
                  placeholder="••••••"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <button
                type="submit"
                disabled={employeeSubmitting}
                className="w-full sm:w-auto shrink-0 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition-all hover:shadow-xl hover:shadow-violet-300 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {employeeSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Oluşturuluyor...
                  </span>
                ) : (
                  "Hesap Oluştur"
                )}
              </button>
            </form>
            {emailPreview && (
              <div className="mt-3 md:mt-4 flex items-center gap-2 rounded-xl bg-violet-50 px-3 md:px-4 py-2.5 ring-1 ring-violet-200">
                <svg className="h-4 w-4 shrink-0 text-violet-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
                <span className="text-xs sm:text-sm font-medium text-violet-700 break-all">{emailPreview}</span>
              </div>
            )}
          </div>
        )}

        {/* ===== MAIN GRID: FORM SIDEBAR + TICKET LIST ===== */}
        <div
          className={`grid grid-cols-1 gap-6 lg:gap-8 ${isAdmin ? "" : "lg:grid-cols-12"}`}
        >
          {/* Non-admin: Ticket creation form sidebar */}
          {!isAdmin && (
            <div className="lg:col-span-4">
              <div className="sticky top-4 lg:top-8">
                <div className="rounded-2xl bg-white p-4 md:p-6 shadow-md ring-1 ring-gray-100">
                  <div className="mb-4 md:mb-6">
                    <h2 className="text-lg font-bold text-gray-900">
                      Yeni Talep Oluştur
                    </h2>
                    <p className="mt-1 text-sm text-gray-400">
                      Sorununuzu bize bildirin, en kısa sürede dönüş yapalım.
                    </p>
                  </div>
                  <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Adınız
                      </label>
                      <input
                        type="text"
                        required
                        value={form.kullaniciAd}
                        onChange={(e) =>
                          setForm({ ...form, kullaniciAd: e.target.value })
                        }
                        placeholder="Örn: Ahmet Yılmaz"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Konu
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={form.konu}
                        onChange={(e) =>
                          setForm({ ...form, konu: e.target.value })
                        }
                        placeholder="Sorununuzu kısaca açıklayın..."
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all resize-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Aciliyet
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {ACILIYET_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() =>
                              setForm({ ...form, aciliyet: opt.value })
                            }
                            className={`rounded-xl px-3 py-2 text-sm font-medium transition-all ${form.aciliyet === opt.value
                              ? `${opt.color} ring-2 ring-offset-1 ring-current scale-[1.02]`
                              : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                              }`}
                          >
                            {opt.value}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:shadow-xl hover:shadow-indigo-300 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg
                            className="h-4 w-4 animate-spin"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            />
                          </svg>
                          Gönderiliyor...
                        </span>
                      ) : (
                        "Talep Gönder"
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Ticket list column */}
          <div className={isAdmin ? "" : "lg:col-span-8"}>
            <div className="mb-4 md:mb-5">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <h2 className="text-base md:text-lg font-bold text-gray-900">
                  {isAdmin ? "Tüm Talepler" : "Taleplerim"}
                  <span className="ml-2 inline-flex items-center justify-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-500">
                    {visibleTickets.length}
                  </span>
                </h2>
              </div>
              {/* Filter/search bar — responsive */}
              <div className="flex flex-col gap-3 rounded-2xl bg-white p-3 md:p-4 shadow-md ring-1 ring-gray-100 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <svg
                    className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                    />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Talep veya kişi ara..."
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <select
                    value={filterDurum}
                    onChange={(e) => setFilterDurum(e.target.value)}
                    className="w-full sm:w-auto rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="">Durum: Tümü</option>
                    <option value="Açık">Açık</option>
                    <option value="Devam Ediyor">Devam Ediyor</option>
                    <option value="Çözüldü">Çözüldü</option>
                    <option value="Kapatıldı">Kapatıldı</option>
                  </select>
                  <select
                    value={filterAciliyet}
                    onChange={(e) => setFilterAciliyet(e.target.value)}
                    className="w-full sm:w-auto rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="">Aciliyet: Tümü</option>
                    <option value="Düşük">Düşük</option>
                    <option value="Orta">Orta</option>
                    <option value="Yüksek">Yüksek</option>
                    <option value="Kritik">Kritik</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Ticket list */}
            {loading ? (
              <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-10 md:p-16 shadow-md ring-1 ring-gray-100">
                <svg
                  className="h-8 w-8 animate-spin text-indigo-500"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                <p className="mt-3 text-sm text-gray-400">
                  Talepler yükleniyor...
                </p>
              </div>
            ) : visibleTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-10 md:p-16 shadow-md ring-1 ring-gray-100">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50">
                  <svg
                    className="h-8 w-8 text-gray-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.15-1.588H6.911a2.25 2.25 0 0 0-2.15 1.588L2.35 13.177a2.25 2.25 0 0 0-.1.661Z"
                    />
                  </svg>
                </div>
                <p className="mt-4 text-sm font-semibold text-gray-900">
                  {isAdmin ? "Henüz talep yok" : "Henüz talep oluşturmadınız"}
                </p>
                <p className="mt-1 text-sm text-gray-400 text-center">
                  {isAdmin
                    ? "Sistemde henüz kayıtlı talep bulunmuyor."
                    : "İlk talebi oluşturmak için yukarıdaki formu kullanın."}
                </p>
              </div>
            ) : (
              <div
                className={`space-y-3 ${isAdmin
                  ? "grid grid-cols-1 gap-3 space-y-0 md:grid-cols-2 lg:grid-cols-3"
                  : ""
                  }`}
              >
                {visibleTickets.map((ticket) => (
                  <div
                    key={ticket._id}
                    className="group rounded-2xl bg-white p-4 md:p-5 shadow-md ring-1 ring-gray-100 transition-all hover:shadow-lg hover:ring-gray-200"
                  >
                    {/* Ticket header: user + badges */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2.5 mb-2">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 text-xs font-bold text-indigo-600 ring-1 ring-indigo-100">
                            {ticket.kullaniciAd?.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {ticket.kullaniciAd}
                            </p>
                            <p className="text-xs text-gray-400">
                              {formatDate(ticket.createdAt)}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed pl-0 sm:pl-[42px]">
                          {ticket.konu}
                        </p>
                      </div>
                      {/* Badges */}
                      <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ring-1 ${DURUM_BADGES[ticket.durum] || DURUM_BADGES["Açık"]
                            }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${DURUM_DOTS[ticket.durum] || DURUM_DOTS["Açık"]
                              }`}
                          />
                          {ticket.durum}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${ACILIYET_OPTIONS.find(
                            (o) => o.value === ticket.aciliyet
                          )?.color || "bg-gray-100 text-gray-600"
                            }`}
                        >
                          {ticket.aciliyet}
                        </span>
                      </div>
                    </div>

                    {/* Admin actions — responsive */}
                    {isAdmin && (
                      <div className="mt-3 md:mt-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-t border-gray-50 pt-3 pl-0 md:pl-[42px]">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-xs text-gray-400 mr-1">
                            Durumu güncelle:
                          </span>
                          {[
                            "Açık",
                            "Devam Ediyor",
                            "Çözüldü",
                            "Kapatıldı",
                          ].map((d) => (
                            <button
                              key={d}
                              onClick={() =>
                                handleStatusChange(ticket._id, d)
                              }
                              disabled={ticket.durum === d}
                              className={`rounded-lg px-2 py-1 text-xs font-medium transition-all ${ticket.durum === d
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-gray-50 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"
                                }`}
                            >
                              {d}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => handleDelete(ticket._id)}
                          className="w-full md:w-auto rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-500 transition-all hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                        >
                          Sil
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ===== TOAST NOTIFICATIONS ===== */}
      <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 flex flex-col gap-2 max-w-[calc(100vw-2rem)]">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 md:px-5 md:py-3.5 shadow-lg ring-1 animate-slideIn ${toast.type === "warning"
              ? "bg-white ring-amber-200 text-amber-700"
              : "bg-white ring-emerald-200 text-emerald-700"
              }`}
          >
            {toast.type === "warning" ? (
              <svg
                className="h-5 w-5 shrink-0 text-amber-500"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                />
              </svg>
            ) : (
              <svg
                className="h-5 w-5 shrink-0 text-emerald-500"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            )}
            <span className="text-sm font-medium">{toast.message}</span>
            <button
              onClick={() =>
                setToasts((prev) => prev.filter((t) => t.id !== toast.id))
              }
              className="ml-2 shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
