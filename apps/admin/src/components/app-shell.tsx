"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { FormEvent, useEffect, useState } from "react"

import { sdk } from "@/lib/sdk"

const navigation = [
  { href: "/dashboard", label: "Tổng quan", short: "TQ" },
  { href: "/products", label: "Sản phẩm", short: "SP" },
  { href: "/orders", label: "Đơn hàng", short: "ĐH" },
  { href: "/promotions", label: "Khuyến mãi", short: "KM" },
  { href: "/repairs", label: "Sửa chữa", short: "SC" },
  { href: "/inventory", label: "Kho hàng", short: "KH" },
  { href: "/customers", label: "Khách hàng", short: "HK" },
]

const systemNavigation = [
  { href: "/staff", label: "Nhân viên & bảo mật", short: "NV" },
  { href: "/audit", label: "Audit log", short: "AL" },
]

type CurrentUserResponse = { user: { id: string; email?: string; first_name?: string; last_name?: string } }

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const currentUser = useQuery({
    queryKey: ["current-admin-user"],
    queryFn: () => sdk.admin.user.me() as unknown as Promise<CurrentUserResponse>,
    retry: false,
  })

  useEffect(() => {
    if (currentUser.isError) router.replace("/login")
  }, [currentUser.isError, router])

  useEffect(() => setOpen(false), [pathname])

  const submitSearch = (event: FormEvent) => {
    event.preventDefault()
    const value = search.trim()
    if (value) router.push(`/products?q=${encodeURIComponent(value)}`)
  }

  const logout = async () => {
    await sdk.auth.logout()
    router.replace("/login")
    router.refresh()
  }

  if (currentUser.isLoading) {
    return <div className="app-loading"><div className="brand-mark">HP</div><p>Đang xác thực phiên làm việc...</p></div>
  }

  if (currentUser.isError || !currentUser.data) return null

  const user = currentUser.data.user
  const displayName = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email || "Admin"

  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="brand"><div className="brand-mark">HP</div><div><strong>Hưng Phát</strong><span>Vận hành</span></div></div>
        <nav aria-label="Điều hướng chính">
          <p className="nav-heading">Vận hành</p>
          {navigation.map((item) => <NavItem key={item.href} {...item} pathname={pathname} />)}
          <p className="nav-heading nav-heading-spaced">Hệ thống</p>
          {systemNavigation.map((item) => <NavItem key={item.href} {...item} pathname={pathname} />)}
        </nav>
        <div className="sidebar-footer">
          <div className="avatar">{displayName.slice(0, 2).toUpperCase()}</div>
          <div className="user-copy"><strong>{displayName}</strong><span>{user.email}</span></div>
          <button className="icon-button" onClick={logout} aria-label="Đăng xuất">Thoát</button>
        </div>
      </aside>
      {open ? <button className="sidebar-backdrop" onClick={() => setOpen(false)} aria-label="Đóng menu" /> : null}
      <div className="app-main">
        <header className="topbar">
          <button className="menu-button" onClick={() => setOpen(true)} aria-label="Mở menu">Menu</button>
          <form className="global-search" onSubmit={submitSearch}>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm sản phẩm, SKU..." aria-label="Tìm kiếm toàn cục" />
            <kbd>Enter</kbd>
          </form>
          <div className="topbar-status"><span className="status-dot" />Hệ thống hoạt động</div>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  )
}

function NavItem({ href, label, short, pathname }: { href: string; label: string; short: string; pathname: string }) {
  const active = pathname === href || pathname.startsWith(`${href}/`)
  return <Link className={`nav-item ${active ? "nav-item-active" : ""}`} href={href}><span className="nav-icon">{short}</span><span>{label}</span></Link>
}
