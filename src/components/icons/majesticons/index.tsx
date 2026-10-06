import React, { forwardRef } from 'react';
import { iconDefinitions, type MajesticonName } from './registry';

export type { MajesticonName };

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  strokeWidth?: number | string;
  type?: 'line' | 'solid';
  weight?: string;
  className?: string;
}

export const Majesticon = forwardRef<SVGSVGElement, IconProps & { name: MajesticonName | string }>(
  ({ name, size = 24, strokeWidth = 2, type = 'line', className, ...props }, ref) => {
    const def = iconDefinitions[name];
    const isSolid = type === 'solid' && Boolean(def?.solid);
    const innerHtml = isSolid ? def?.solid : def?.line;

    if (!innerHtml) return null;

    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill={isSolid ? 'currentColor' : 'none'}
        stroke={isSolid ? 'none' : 'currentColor'}
        strokeWidth={isSolid ? undefined : strokeWidth}
        strokeLinecap={isSolid ? undefined : 'round'}
        strokeLinejoin={isSolid ? undefined : 'round'}
        className={className}
        dangerouslySetInnerHTML={{ __html: innerHtml }}
        {...props}
      />
    );
  }
);
Majesticon.displayName = 'Majesticon';

export function createIcon(name: MajesticonName, defaultType: 'line' | 'solid' = 'line') {
  const Component = forwardRef<SVGSVGElement, IconProps>((props, ref) => (
    <Majesticon ref={ref} name={name} type={defaultType} {...props} />
  ));
  Component.displayName = `Majesticon(${name})`;
  return Component;
}

// Named Icon exports mapped to Majesticons icons
export const Folder = createIcon('folder');
export const FolderSimple = Folder;
export const FolderOpen = Folder;

export const Briefcase = createIcon('briefcase');
export const BriefcaseBusiness = Briefcase;

export const Camera = createIcon('camera');
export const Cpu = createIcon('cpu');

export const Award = createIcon('award');
export const Certificate = Award;
export const GraduationCap = createIcon('document-award');
export const DocumentAward = GraduationCap;

export const Mail = createIcon('mail');
export const EnvelopeSimple = Mail;

export const ContactIcon = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 1.5, type: _type, weight: _weight, className, ...props }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M20 9v10a2 2 0 0 1-2 2h-4m6-12v-.172a2 2 0 0 0-.586-1.414l-3.828-3.828A2 2 0 0 0 14.172 3H14m6 6h-4a2 2 0 0 1-2-2V3m0 0H6a2 2 0 0 0-2 2v8m-2 3.258 1.235.823a2.59 2.59 0 0 0 3.265-.323 2.59 2.59 0 0 1 3.265-.323l1.235.823m-9 3 1.235.823a2.59 2.59 0 0 0 3.265-.323 2.59 2.59 0 0 1 3.265-.323l1.235.823" />
    </svg>
  )
);
ContactIcon.displayName = 'ContactIcon';

export const GearIcon = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth: _sw, type: _type, weight: _weight, className, ...props }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      className={className}
      {...props}
    >
      <path
        fill="currentColor"
        d="M4 7c0-.55.45-1 1-1h16c.55 0 1-.45 1-1s-.45-1-1-1H4c-1.1 0-2 .9-2 2v11h-.5c-.83 0-1.5.67-1.5 1.5S.67 20 1.5 20H14v-3H4zm19 1h-6c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h6c.55 0 1-.45 1-1V9c0-.55-.45-1-1-1m-1 9h-4v-7h4z"
      />
    </svg>
  )
);
GearIcon.displayName = 'GearIcon';

export const CertificateIcon = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth: _sw, type: _type, weight: _weight, className, ...props }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      className={className}
      {...props}
    >
      <path
        fill="currentColor"
        d="m21 7-9-5-9 5v10l9 5 9-5zm-9-2.71 5.91 3.28-3.01 1.67A4.02 4.02 0 0 0 12 8c-1.14 0-2.17.48-2.9 1.24L6.09 7.57zm-1 14.87-6-3.33V9.26L8.13 11c-.09.31-.13.65-.13 1 0 1.86 1.27 3.43 3 3.87zM10 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2m3 7.16v-3.28c1.73-.44 3-2.01 3-3.87 0-.35-.04-.69-.13-1.01L19 9.26v6.57z"
      />
    </svg>
  )
);
CertificateIcon.displayName = 'CertificateIcon';

export const ChevronRight = createIcon('chevron-right');
export const CaretRight = ChevronRight;

export const ChevronLeft = createIcon('chevron-left');
export const CaretLeft = ChevronLeft;

export const ChevronDown = createIcon('chevron-down');
export const CaretDown = ChevronDown;

export const ChevronUp = createIcon('chevron-up');
export const CaretUp = ChevronUp;

export const Close = createIcon('close');
export const X = Close;

export const Menu = createIcon('menu');
export const List = Menu;

export const Clock = createIcon('clock');
export const Calendar = createIcon('calendar');
export const CalendarPlus = createIcon('calendar-plus');

export const Send = createIcon('send');
export const PaperPlaneTilt = Send;

export const ArrowRight = createIcon('arrow-right');
export const ArrowLeft = createIcon('arrow-left');
export const ArrowUp = createIcon('arrow-up');
export const ArrowDown = createIcon('arrow-down');

export const Open = createIcon('open');
export const ExternalLink = Open;
export const ArrowSquareOut = Open;
export const ArrowUpRight = Open;

export const CheckCircle = createIcon('clipboard-check');
export const CheckCircle2 = CheckCircle;
export const ClipboardCheck = CheckCircle;
export const Check = createIcon('check');

export const Lock = createIcon('lock');
export const Eye = createIcon('eye');
export const EyeOff = createIcon('eye-off');
export const Key = createIcon('key');
export const KeyRound = Key;

export const Shield = createIcon('shield');
export const ShieldCheck = Shield;

export const Sparkles = createIcon('comet');
export const Comet = Sparkles;

export const Heart = createIcon('heart');
export const Chat = createIcon('chat');
export const MessageCircle = Chat;
export const MessageSquare = Chat;

export const Globe = createIcon('globe-earth');
export const Globe2 = Globe;

export const Laptop = createIcon('laptop');
export const MapPin = createIcon('map-marker');

export const Analytics = createIcon('analytics');
export const BarChart3 = Analytics;

export const Bookmark = createIcon('bookmark');
export const BookOpen = createIcon('book-open');
export const Book = createIcon('book');

export const Music = createIcon('music');
export const Play = createIcon('play-circle');
export const SkipBack = createIcon('backward-start-circle');
export const SkipForward = createIcon('forward-end-circle');

export const Pulse = createIcon('pulse');
export const Dumbbell = Pulse;

export const Leaf = createIcon('leaf-3-angled');
export const Trees = Leaf;

export const Cup = createIcon('cup');
export const Utensils = Cup;

export const MoreMenu = createIcon('more-menu');
export const GripHorizontal = MoreMenu;

export const LayoutGrid = createIcon('layout-grid-2');
export const SquaresFour = LayoutGrid;

export const Layers = createIcon('layers-2-vertical');
export const Stack = Layers;

export const Home = createIcon('home-simple');
export const HomeSimple = Home;

export const FileText = createIcon('document');
export const Document = FileText;

export const Code = createIcon('code');
export const Compass = createIcon('compass-2');
export const Brain = createIcon('atom-2');
export const Workflow = createIcon('git-branch');
export const Plug = createIcon('usb');
export const CreditCard = createIcon('creditcard');
export const TrendingUp = createIcon('analytics');
export const Zap = createIcon('lightning-bolt');
export const FlaskConical = createIcon('flask');
export const Copy = createIcon('clipboard');
export const Languages = createIcon('chat-text');

export const LinkedIn = createIcon('linkedin');
export const Instagram = createIcon('instagram');
export const GitHub = createIcon('github');
export const Pexels = createIcon('pexels');
