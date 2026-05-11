import { Navigate, Outlet, useLocation } from "react-router-dom"

interface ProtectedRouteProps {
  allowedRoles?: string[]
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const location = useLocation()
  const token = localStorage.getItem("token")

  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    )
  }

  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}")
    const role = user?.role

    if (allowedRoles && allowedRoles.length > 0) {
      if (!allowedRoles.includes(role)) {
        // Redirect to appropriate dashboard based on role
        if (role === "SANTRI") return <Navigate to="/santri" replace />
        if (role === "WALI" || role === "WALI_SANTRI") return <Navigate to="/wali" replace />
        if (role === "ADMIN" || role === "SUPERADMIN" || role === "MENTOR") return <Navigate to="/dashboard" replace />
        
        // Fallback for unknown roles
        return <Navigate to="/login" replace />
      }
    }
  } catch (error) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
