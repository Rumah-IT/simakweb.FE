import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'

// Auth
import Beranda from './pages/auth/Beranda'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import OtpPage from './pages/auth/OtpPage'

// Admin – Layout & Shared
import DashboardLayout from './pages/admin/DashboardLayout'
import DashboardPage from './pages/admin/DashboardPage'
import ProfilePage from './pages/admin/ProfilePage'
import ProtectedRoute from './components/ProtectedRoute'

// Admin – Fase 1: Core
import SantriPage from './pages/admin/SantriPage'
import WaliProfilePage from './pages/admin/WaliProfilePage'
import DivisiPage from './pages/admin/DivisiPage'
import KelasPage from './pages/admin/KelasPage'

// Admin – Fase 2: Akademik
import AbsensiPage from './pages/admin/AbsensiPage'
import TugasPage from './pages/admin/TugasPage'
import SubmissionPage from './pages/admin/SubmissionPage'
import JurnalPage from './pages/admin/JurnalPage'

// Admin – Fase 3: Evaluasi & Wali
import NilaiPage from './pages/admin/NilaiPage'
import WaliPage from './pages/admin/WaliPage'
import RelasiPage from './pages/admin/RelasiPage'

// Santri Portal
import SantriLayout from './pages/santri/SantriLayout'
import SantriDashboardPage from './pages/santri/SantriDashboardPage'
import SantriAbsensiPage from './pages/santri/SantriAbsensiPage'
import SantriTugasPage from './pages/santri/SantriTugasPage'
import SantriNilaiPage from './pages/santri/SantriNilaiPage'
import SantriJurnalPage from './pages/santri/SantriJurnalPage'

function RoleRedirect() {
  try {
    const user = JSON.parse(localStorage.getItem("user") ?? "{}")
    const role: string = user?.role ?? ""
    if (role === "SANTRI") return <Navigate to="/santri" replace />
  } catch {}
  return <Navigate to="/dashboard" replace />
}

function App() {
  return (
    <>
    <Toaster position="top-right" richColors closeButton />
    <Routes>
      <Route path="/" element={<RoleRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/otp" element={<OtpPage />} />
      <Route path="/dev/beranda" element={<Beranda />} />

      {/* Admin / Mentor Dashboard */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardPage />} />

          {/* Fase 1 – Core */}
          <Route path="santri" element={<SantriPage />} />
          <Route path="santri/:santriId/wali-profile" element={<WaliProfilePage />} />
          <Route path="divisi" element={<DivisiPage />} />
          <Route path="kelas" element={<KelasPage />} />

          {/* Fase 2 – Akademik */}
          <Route path="absensi" element={<AbsensiPage />} />
          <Route path="tugas" element={<TugasPage />} />
          <Route path="submisi" element={<SubmissionPage />} />
          <Route path="jurnal" element={<JurnalPage />} />

          {/* Fase 3 – Evaluasi */}
          <Route path="nilai" element={<NilaiPage />} />
          <Route path="wali" element={<WaliPage />} />
          <Route path="relasi" element={<RelasiPage />} />

          {/* Shared */}
          <Route path="settings" element={<DashboardPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>

      {/* Santri Portal */}
      <Route element={<ProtectedRoute />}>
        <Route path="/santri" element={<SantriLayout />}>
          <Route index element={<SantriDashboardPage />} />
          <Route path="absensi" element={<SantriAbsensiPage />} />
          <Route path="tugas" element={<SantriTugasPage />} />
          <Route path="jurnal" element={<SantriJurnalPage />} />
          <Route path="nilai" element={<SantriNilaiPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>
    </Routes>
    </>
  )
}

export default App
