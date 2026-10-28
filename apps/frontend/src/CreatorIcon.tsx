import type { SVGProps } from "react";

export type CreatorIconName =
  | "dashboard" | "profile" | "search" | "projects" | "portfolio" | "video"
  | "upload" | "brief" | "calendar" | "messages" | "analytics" | "payments"
  | "contract" | "team" | "notifications" | "settings" | "help" | "verification"
  | "ideas" | "collaboration" | "growth" | "logout" | "refresh" | "plus" | "check";

type Props = SVGProps<SVGSVGElement> & { name: CreatorIconName; size?: number };

export default function CreatorIcon({ name, size = 18, ...props }: Props) {
  return <svg
    aria-hidden="true"
    focusable="false"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.65"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  ><use href={`/creator-icons.svg#${name}`} /></svg>;
}
