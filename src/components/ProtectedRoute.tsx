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

  let user = null
  try {
    user = JSON.parse(localStorage.getItem("user") || "{}")
  } catch (error) {
    console.error("Failed to parse user data:", error)
  }

  const role = user?.role

  if (allowedRoles && allowedRoles.length > 0) {
    if (!role || !allowedRoles.includes(role)) {
      console.warn(`Access denied: User role "${role}" not in allowed roles [${allowedRoles.join(", ")}]`)
      
      // Redirect to appropriate dashboard based on role
      if (role === "SANTRI") return <Navigate to="/santri" replace />
      if (role === "WALI" || role === "WALI_SANTRI") return <Navigate to="/wali" replace />
      if (role === "MENTOR") return <Navigate to="/mentor" replace />
      if (role === "ADMIN" || role === "SUPERADMIN") return <Navigate to="/dashboard" replace />
      
      // Fallback for unknown or unauthorized roles
      return <Navigate to="/login" replace />
    }
  }

  return <Outlet />
}
