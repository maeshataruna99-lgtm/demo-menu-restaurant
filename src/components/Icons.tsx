import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

function Svg({ children, ...p }: P) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...p}
    >
      {children}
    </svg>
  );
}

export const IconLogo = (p: P) => (
  <Svg {...p}>
    <path d="M4 12.5h16c0 3.6-2.4 6.4-5.6 7.3l.1 1.2H9.5l.1-1.2C6.4 18.9 4 16.1 4 12.5Z" />
    <path d="M9 9.2c-.9-1-.9-2.1 0-3.2" />
    <path d="M12.5 9.2c-.9-1-.9-2.1 0-3.2" />
    <path d="M16 9.2c-.9-1-.9-2.1 0-3.2" />
  </Svg>
);

export const IconBell = (p: P) => (
  <Svg {...p}>
    <path d="M6 9.5a6 6 0 0 1 12 0c0 4.6 1.5 5.8 1.5 5.8h-15S6 14.1 6 9.5Z" />
    <path d="M10 18.8a2.2 2.2 0 0 0 4 0" />
  </Svg>
);

export const IconFlame = (p: P) => (
  <Svg {...p}>
    <path d="M12 3.5c1.4 2.4 4.6 4.2 4.6 8a4.6 4.6 0 0 1-9.2 0c0-1.6.6-3 1.6-4.1.2 1 .8 1.8 1.7 2.2-.5-2.3.2-4.3 1.3-6.1Z" />
    <path d="M12 19.5v-3" />
  </Svg>
);

export const IconClock = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.2" />
    <path d="M12 7.5V12l3 1.8" />
  </Svg>
);

export const IconReceipt = (p: P) => (
  <Svg {...p}>
    <path d="M7 3.5h10V20l-2.5-1.6L12 20l-2.5-1.6L7 20V3.5Z" />
    <path d="M9.5 8h5M9.5 11.5h5" />
  </Svg>
);

export const IconCoin = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.2" />
    <path d="M12 7.8v8.4M9.4 9.6c0-1 1.2-1.7 2.6-1.7s2.6.7 2.6 1.6c0 2.6-5.2 1.2-5.2 3.9 0 1 1.2 1.7 2.6 1.7s2.6-.7 2.6-1.7" />
  </Svg>
);

export const IconPot = (p: P) => (
  <Svg {...p}>
    <path d="M4.5 14.5a7.5 7.5 0 0 1 15 0" />
    <path d="M3 14.5h18" />
    <path d="M9.5 18.5h5" />
    <circle cx="12" cy="5.5" r="1" />
  </Svg>
);

export const IconSend = (p: P) => (
  <Svg {...p}>
    <path d="M20.5 3.5 10 14" />
    <path d="M20.5 3.5 14 20.5l-4-6.5-7-2.5 17.5-8Z" />
  </Svg>
);

export const IconPlus = (p: P) => (
  <Svg {...p}>
    <path d="M12 5.5v13M5.5 12h13" />
  </Svg>
);

export const IconMinus = (p: P) => (
  <Svg {...p}>
    <path d="M5.5 12h13" />
  </Svg>
);

export const IconX = (p: P) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Svg>
);

export const IconCheck = (p: P) => (
  <Svg {...p}>
    <path d="M4.5 12.5 9.5 17.5 19.5 6.5" />
  </Svg>
);

export const IconTrash = (p: P) => (
  <Svg {...p}>
    <path d="M4.5 6.5h15M9.5 6V4.5h5V6M7 6.5l.8 13h8.4l.8-13" />
    <path d="M10.2 10v6M13.8 10v6" />
  </Svg>
);

export const IconSearch = (p: P) => (
  <Svg {...p}>
    <circle cx="10.5" cy="10.5" r="6.2" />
    <path d="m19.5 19.5-4.5-4.5" />
  </Svg>
);

export const IconBag = (p: P) => (
  <Svg {...p}>
    <path d="M6 8h12l1 12.5H5L6 8Z" />
    <path d="M9 10.5V6.8a3 3 0 0 1 6 0v3.7" />
  </Svg>
);

export const IconTable = (p: P) => (
  <Svg {...p}>
    <path d="M3.5 8.5h17M5 8.5 4 19M19 8.5 20 19M7.5 13h9" />
  </Svg>
);

export const IconArrow = (p: P) => (
  <Svg {...p}>
    <path d="M4 12h15M13.5 6l6 6-6 6" />
  </Svg>
);

export const IconSparkle = (p: P) => (
  <Svg {...p}>
    <path d="M12 4.5c.6 3.4 2.1 4.9 5.5 5.5-3.4.6-4.9 2.1-5.5 5.5-.6-3.4-2.1-4.9-5.5-5.5 3.4-.6 4.9-2.1 5.5-5.5Z" />
    <path d="M18.5 15.5c.3 1.5 1 2.2 2.5 2.5-1.5.3-2.2 1-2.5 2.5-.3-1.5-1-2.2-2.5-2.5 1.5-.3 2.2-1 2.5-2.5Z" />
  </Svg>
);

export const IconNote = (p: P) => (
  <Svg {...p}>
    <path d="M5 4.5h14v11l-4 4H5v-15Z" />
    <path d="M15 19.5v-4h4" />
  </Svg>
);

export const IconEdit2 = (p: P) => (
  <Svg {...p}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </Svg>
);

export const IconTrash2 = (p: P) => (
  <Svg {...p}>
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </Svg>
);

export const IconSave = (p: P) => (
  <Svg {...p}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <path d="M17 21v-8H7v8" />
    <path d="M7 3v5h8" />
  </Svg>
);

export const IconChevronDown = (p: P) => (
  <Svg {...p}>
    <path d="m6 9 6 6 6-6" />
  </Svg>
);

export const IconChevronUp = (p: P) => (
  <Svg {...p}>
    <path d="m18 15-6-6-6 6" />
  </Svg>
);

export const IconUser = (p: P) => (
  <Svg {...p}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </Svg>
);
