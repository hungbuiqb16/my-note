import { useState } from 'react'
import {
  ChevronDown,
  FileText,
  Info,
  LogOut,
  Settings,
  ShieldCheck,
  UserRound,
  UserRoundPen,
} from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AboutDialog,
  AccountSettingsDialog,
  EditProfileDialog,
  PrivacyDialog,
  ProfileDialog,
  TermsDialog,
} from '@/components/common/UserDialogs'
import { useAuth } from '@/store/auth'

type DialogView =
  | 'profile'
  | 'edit'
  | 'account'
  | 'privacy'
  | 'about'
  | 'terms'
  | null

export function UserMenu() {
  const user = useAuth((s) => s.user)
  const signOut = useAuth((s) => s.signOut)
  const [view, setView] = useState<DialogView>(null)

  const email = user?.email ?? ''
  const metaName = user?.user_metadata?.full_name as string | undefined
  const name = metaName || email.split('@')[0] || 'Người dùng'
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined

  const initials = name
    .split(/[\s.]+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const handleLogout = async () => {
    try {
      await signOut()
    } catch {
      toast.error('Đăng xuất thất bại')
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-colors outline-none hover:bg-black/[.04] focus-visible:ring-2 focus-visible:ring-primary dark:hover:bg-white/[.06]">
          <Avatar className="size-8">
            <AvatarImage src={avatarUrl} alt={name} />
            <AvatarFallback className="grad-btn text-xs font-semibold text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="min-w-0 flex-1 truncate text-sm font-semibold">
            {name}
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          side="top"
          sideOffset={8}
          className="w-56"
        >
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="truncate text-sm font-semibold">{name}</span>
            <span className="truncate text-xs font-normal text-muted-foreground">
              {email}
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setView('profile')}>
            <UserRound />
            Hồ sơ của tôi
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setView('edit')}>
            <UserRoundPen />
            Chỉnh sửa hồ sơ
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setView('account')}>
            <Settings />
            Cài đặt tài khoản
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setView('privacy')}>
            <ShieldCheck />
            Quyền riêng tư
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setView('about')}>
            <Info />
            Giới thiệu
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setView('terms')}>
            <FileText />
            Điều khoản
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={handleLogout}>
            <LogOut />
            Đăng xuất
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ProfileDialog
        open={view === 'profile'}
        onOpenChange={(o) => !o && setView(null)}
      />
      <EditProfileDialog
        open={view === 'edit'}
        onOpenChange={(o) => !o && setView(null)}
      />
      <AccountSettingsDialog
        open={view === 'account'}
        onOpenChange={(o) => !o && setView(null)}
      />
      <PrivacyDialog
        open={view === 'privacy'}
        onOpenChange={(o) => !o && setView(null)}
      />
      <AboutDialog
        open={view === 'about'}
        onOpenChange={(o) => !o && setView(null)}
      />
      <TermsDialog
        open={view === 'terms'}
        onOpenChange={(o) => !o && setView(null)}
      />
    </>
  )
}
