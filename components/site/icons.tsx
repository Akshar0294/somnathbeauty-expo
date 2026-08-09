import type { SVGProps } from "react";

type IconName = "arrow" | "calendar" | "chevron" | "close" | "clock" | "download" | "email" | "location" | "menu" | "phone" | "sparkle" | "users" | "whatsapp" | "check" | "lock" | "bag" | "star";

export function Icon({ name, size = 20, ...props }: SVGProps<SVGSVGElement> & { name: IconName; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };

  switch (name) {
    case "arrow":
      return <svg {...common} {...props}><path d="M5 12h13M13 6l6 6-6 6" /></svg>;
    case "chevron":
      return <svg {...common} {...props}><path d="m6 9 6 6 6-6" /></svg>;
    case "calendar":
      return <svg {...common} {...props}><rect x="3" y="4.5" width="18" height="17" rx="2" /><path d="M16 2.5v4M8 2.5v4M3 9h18" /></svg>;
    case "clock":
      return <svg {...common} {...props}><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3.5 2" /></svg>;
    case "download":
      return <svg {...common} {...props}><path d="M12 3v11m0 0 4-4m-4 4-4-4M4 19h16" /></svg>;
    case "location":
      return <svg {...common} {...props}><path d="M19 10.2c0 5.2-7 10.3-7 10.3S5 15.4 5 10.2a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2.2" /></svg>;
    case "phone":
      return <svg {...common} {...props}><path d="M6.6 3.5 9 3l1.5 4-2 1.5c1 2.2 2.8 4 5 5l1.5-2 4 1.5-.5 2.4a2 2 0 0 1-2.2 1.6A15 15 0 0 1 5 5.7a2 2 0 0 1 1.6-2.2Z" /></svg>;
    case "email":
      return <svg {...common} {...props}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></svg>;
    case "menu":
      return <svg {...common} {...props}><path d="M4 7h16M4 12h16M4 17h16" /></svg>;
    case "close":
      return <svg {...common} {...props}><path d="m6 6 12 12M18 6 6 18" /></svg>;
    case "sparkle":
      return <svg {...common} {...props}><path d="m12 3 1.5 6.5L20 12l-6.5 1.5L12 20l-1.5-6.5L4 12l6.5-2.5L12 3Z" /><path d="m19 3 .4 1.6L21 5l-1.6.4L19 7l-.4-1.6L17 5l1.6-.4L19 3Z" /></svg>;
    case "users":
      return <svg {...common} {...props}><circle cx="9" cy="8" r="3" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 11a3 3 0 1 0 0-6M16 14a5.5 5.5 0 0 1 4.5 5" /></svg>;
    case "whatsapp":
      return <svg {...common} {...props}><path d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.5-4.1A8 8 0 1 1 20 11.5Z" /><path d="M8.5 8.5c.3 2 2 3.8 4 4.5.7.2 1.2-.4 1.5-.8l.5-.8-1.5-.9-.7.7a5.3 5.3 0 0 1-2-2l.7-.7-.9-1.5-.8.5c-.5.3-.9.7-.8 1Z" /></svg>;
    case "check":
      return <svg {...common} {...props}><path d="m5 12 4.5 4.5L19 7" /></svg>;
    case "lock":
      return <svg {...common} {...props}><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>;
    case "bag":
      return <svg {...common} {...props}><path d="M5 8h14l-1 12H6L5 8Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg>;
    case "star":
      return <svg {...common} {...props}><path d="m12 3 2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.8L6.6 20l1-6L3.3 9.4l6-.9L12 3Z" /></svg>;
    default:
      return null;
  }
}
