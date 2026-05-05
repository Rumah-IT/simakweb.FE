import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import Beranda from './pages/Beranda'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import OtpPage from './pages/OtpPage'
import DashboardLayout from './pages/DashboardLayout'
import DashboardPage from './pages/DashboardPage'
import ProfilePage from './pages/ProfilePage'
import ProtectedRoute from './components/ProtectedRoute'
import TugasPage from './pages/TugasPage'

// Fase 1 – Core
import SantriPage from './pages/SantriPage'
import WaliProfilePage from './pages/WaliProfilePage'
import DivisiPage from './pages/DivisiPage'
import KelasPage from './pages/KelasPage'

// Fase 2 – Akademik
import AbsensiPage from './pages/AbsensiPage'
import SubmissionPage from './pages/SubmissionPage'
import JurnalPage from './pages/JurnalPage'

// Fase 3 – Evaluasi
import NilaiPage from './pages/NilaiPage'
import WaliPage from './pages/WaliPage'
import RelasiPage from './pages/RelasiPage'

// Santri Portal
import SantriLayout from './pages/SantriLayout'
import SantriDashboardPage from './pages/santri/SantriDashboardPage'

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

          {/* Existing */}
          <Route path="settings" element={<DashboardPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>

      {/* Santri Portal */}
      <Route element={<ProtectedRoute />}>
        <Route path="/santri" element={<SantriLayout />}>
          <Route index element={<SantriDashboardPage />} />
          <Route path="absensi" element={<AbsensiPage />} />
          <Route path="tugas" element={<TugasPage />} />
          <Route path="jurnal" element={<JurnalPage />} />
          <Route path="nilai" element={<NilaiPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>
    </Routes>
    </>
  )
}

export default App
