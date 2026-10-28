import {
  BadgeCheck, Bell, BriefcaseBusiness, CalendarDays, ChartNoAxesCombined,
  Check, Clapperboard, ClipboardList, FileText, FolderKanban, Handshake,
  LayoutDashboard, Lightbulb, LogOut, MessagesSquare, Plus, RefreshCw,
  Search, Settings2, TrendingUp, Upload, UserRound, UsersRound, WalletCards,
  CircleHelp, type LucideIcon,
} from "lucide-react";
import type { SVGProps } from "react";

export type CreatorIconName =
  | "dashboard" | "profile" | "search" | "projects" | "portfolio" | "video"
  | "upload" | "brief" | "calendar" | "messages" | "analytics" | "payments"
  | "contract" | "team" | "notifications" | "settings" | "help" | "verification"
  | "ideas" | "collaboration" | "growth" | "logout" | "refresh" | "plus" | "check";

const icons: Record<CreatorIconName, LucideIcon> = {
  dashboard: LayoutDashboard, profile: UserRound, search: Search,
  projects: FolderKanban, portfolio: BriefcaseBusiness, video: Clapperboard,
  upload: Upload, brief: ClipboardList, calendar: CalendarDays,
  messages: MessagesSquare, analytics: ChartNoAxesCombined, payments: WalletCards,
  contract: FileText, team: UsersRound, notifications: Bell, settings: Settings2,
  help: CircleHelp, verification: BadgeCheck, ideas: Lightbulb,
  collaboration: Handshake, growth: TrendingUp, logout: LogOut,
  refresh: RefreshCw, plus: Plus, check: Check,
};

type Props = SVGProps<SVGSVGElement> & { name: CreatorIconName; size?: number };

export default function CreatorIcon({ name, size = 18, ...props }: Props) {
  const Icon = icons[name];
  return <Icon aria-hidden="true" focusable="false" width={size} height={size} strokeWidth={1.7} {...props} />;
}
