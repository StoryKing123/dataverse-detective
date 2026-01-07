import { ReactNode } from "react"

interface SidebarProps {
  children: ReactNode
}

export function Sidebar({ children }: SidebarProps) {
  return (
    <aside className="flex h-full w-80 flex-col border-r bg-sidebar">
      {children}
    </aside>
  )
}
