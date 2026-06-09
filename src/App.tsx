import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'

import Beranda from './pages/auth/Beranda'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import OtpPage from './pages/auth/OtpPage'

import DashboardLayout from './pages/admin/DashboardLayout'
import DashboardPage from './pages/admin/DashboardPage'
import ProfilePage from './pages/admin/ProfilePage'
import ProtectedRoute from './components/ProtectedRoute'

import SantriPage from './pages/admin/SantriPage'
import WaliProfilePage from './pages/admin/WaliProfilePage'
import DivisiPage from './pages/admin/DivisiPage'
import KelasPage from './pages/admin/KelasPage'

import AbsensiPage from './pages/admin/AbsensiPage'
import TugasPage from './pages/admin/TugasPage'
import SubmissionPage from './pages/admin/SubmissionPage'
import JurnalPage from './pages/admin/JurnalPage'

import NilaiPage from './pages/admin/NilaiPage'
import WaliPage from './pages/admin/WaliPage'
import RelasiPage from './pages/admin/RelasiPage'
import MentorPage from './pages/admin/MentorPage'
import KelasDetailPage from './pages/admin/KelasDetailPage'
import DivisiDetailPage from './pages/admin/DivisiDetailPage'

import SantriLayout from './pages/santri/SantriLayout'
import SantriDashboardPage from './pages/santri/SantriDashboardPage'
import SantriAbsensiPage from './pages/santri/SantriAbsensiPage'
import SantriTugasPage from './pages/santri/SantriTugasPage'
import SantriNilaiPage from './pages/santri/SantriNilaiPage'
import SantriJurnalPage from './pages/santri/SantriJurnalPage'

import WaliLayout from './pages/wali/WaliLayout'
import WaliDashboardPage from './pages/wali/WaliDashboardPage'
import WaliSantriDetailPage from './pages/wali/WaliSantriDetailPage'

import MentorLayout from './pages/mentor/MentorLayout'
import MentorDashboardPage from './pages/mentor/MentorDashboardPage'
import MentorKelasPage from './pages/mentor/MentorKelasPage'
import MentorSantriPage from './pages/mentor/MentorSantriPage'
import MentorJurnalPage from './pages/mentor/MentorJurnalPage'
import MentorNilaiPage from './pages/mentor/MentorNilaiPage'
import MentorAbsensiPage from './pages/mentor/MentorAbsensiPage'
import MentorTugasPage from './pages/mentor/MentorTugasPage'
import MentorSubmisiPage from './pages/mentor/MentorSubmisiPage'

function RoleRedirect() {
  try {
    const token = localStorage.getItem("token")
    if (!token) return <Navigate to="/login" replace />

    const user = JSON.parse(localStorage.getItem("user") ?? "{}")
    const role: string = user?.role ?? ""
    if (role === "SANTRI") return <Navigate to="/santri" replace />
    if (role === "WALI" || role === "WALI_SANTRI") return <Navigate to="/wali" replace />
    if (role === "MENTOR") return <Navigate to="/mentor" replace />
    if (role === "ADMIN" || role === "SUPERADMIN") return <Navigate to="/dashboard" replace />
  } catch {}
  return <Navigate to="/login" replace />
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

      <Route element={<ProtectedRoute allowedRoles={["ADMIN", "SUPERADMIN"]} />}>
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardPage />} />

          <Route path="santri" element={<SantriPage />} />
          <Route path="santri/:santriId/wali-profile" element={<WaliProfilePage />} />
          <Route path="mentor" element={<MentorPage />} />
          <Route path="divisi" element={<DivisiPage />} />
          <Route path="divisi/:divisiId" element={<DivisiDetailPage />} />
          <Route path="kelas" element={<KelasPage />} />
          <Route path="kelas/:kelasId" element={<KelasDetailPage />} />

<Route path="absensi" element={<AbsensiPage />} />
          <Route path="tugas" element={<TugasPage />} />
          <Route path="submisi" element={<SubmissionPage />} />
          <Route path="jurnal" element={<JurnalPage />} />

<Route path="nilai" element={<NilaiPage />} />
          <Route path="wali" element={<WaliPage />} />
          <Route path="relasi" element={<RelasiPage />} />

<Route path="settings" element={<DashboardPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["SANTRI"]} />}>
        <Route path="/santri" element={<SantriLayout />}>
          <Route index element={<SantriDashboardPage />} />
          <Route path="absensi" element={<SantriAbsensiPage />} />
          <Route path="tugas" element={<SantriTugasPage />} />
          <Route path="jurnal" element={<SantriJurnalPage />} />
          <Route path="nilai" element={<SantriNilaiPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["WALI_SANTRI", "WALI"]} />}>
        <Route path="/wali" element={<WaliLayout />}>
          <Route index element={<WaliDashboardPage />} />
          <Route path="santri/:id" element={<WaliSantriDetailPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["MENTOR"]} />}>
        <Route path="/mentor" element={<MentorLayout />}>
          <Route index element={<MentorDashboardPage />} />
          <Route path="kelas" element={<MentorKelasPage />} />
          <Route path="santri" element={<MentorSantriPage />} />
          <Route path="jurnal" element={<MentorJurnalPage />} />
          <Route path="nilai" element={<MentorNilaiPage />} />
          <Route path="absensi" element={<MentorAbsensiPage />} />
          <Route path="tugas" element={<MentorTugasPage />} />
          <Route path="submisi" element={<MentorSubmisiPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>
    </Routes>
    </>
  )
}

export default App
