import * as React from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  Users,
  LogOut,
  ChevronRight,
  UserCircle,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const navWali = [
  {
    title: "Beranda",
    items: [
      { title: "Dashboard", url: "/wali", icon: LayoutDashboard },
    ],
  },
]

export function WaliSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation()
  const navigate = useNavigate()

  const [storedUser, setStoredUser] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem("user") ?? "{}") } catch { return {} }
  })
  const [photoUrl, setPhotoUrl] = React.useState<string | null>(
    localStorage.getItem("profile_photo")
  )

  React.useEffect(() => {
    try { setStoredUser(JSON.parse(localStorage.getItem("user") ?? "{}")) } catch {}
    setPhotoUrl(localStorage.getItem("profile_photo"))
  }, [location.pathname])

  const displayName: string = storedUser.name ?? storedUser.fullName ?? "Wali"
  const displayEmail: string = storedUser.email ?? ""
  const initials = displayName.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    navigate("/login", { replace: true })
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="h-16 border-b border-sidebar-border px-4">
        <div className="flex items-center gap-3 px-2 py-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md">
            <Users className="h-5 w-5" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-bold leading-tight tracking-tight">Portal Wali</span>
            <span className="text-xs text-muted-foreground">Monitoring Santri</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {navWali.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = location.pathname === item.url
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        isActive={isActive}
                        tooltip={item.title}
                        render={<Link to={item.url} />}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarSeparator />
      <SidebarFooter className="pb-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-ring group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full overflow-hidden bg-primary text-[10px] font-bold text-primary-foreground">
                  {photoUrl
                    ? <img src={photoUrl} alt="avatar" className="h-full w-full object-cover" />
                    : initials
                  }
                </div>
                <div className="flex flex-col items-start text-left group-data-[collapsible=icon]:hidden">
                  <span className="text-sm font-medium leading-none">{displayName}</span>
                  <span className="text-xs text-muted-foreground">{displayEmail}</span>
                </div>
                <ChevronRight className="ml-auto h-4 w-4 opacity-50 group-data-[collapsible=icon]:hidden" />
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" className="w-52" align="start">
                <DropdownMenuItem onClick={() => navigate("/wali/profile")} className="cursor-pointer">
                  <UserCircle className="mr-2 h-4 w-4" />
                  Profil Saya
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-500 focus:text-red-500">
                  <LogOut className="mr-2 h-4 w-4" />
                  Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
