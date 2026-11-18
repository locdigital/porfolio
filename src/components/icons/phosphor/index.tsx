import React, { forwardRef } from 'react';
import {
  iconDefinitions,
  resolvePhosphorWeight,
  type PhosphorIconName,
  type PhosphorWeight,
  type MajesticonName,
} from './registry';

export type { PhosphorIconName, PhosphorWeight, MajesticonName };

export interface IconProps extends Omit<React.SVGProps<SVGSVGElement>, 'stroke'> {
  size?: number | string;
  strokeWidth?: number | string;
  stroke?: number | string;
  type?: 'line' | 'solid' | 'outline' | 'filled' | PhosphorWeight;
  weight?: PhosphorWeight;
  className?: string;
}

export const PhosphorIcon = forwardRef<SVGSVGElement, IconProps & { name: PhosphorIconName | string }>(
  ({ name, size = 24, strokeWidth, stroke, type, weight, className, ...props }, ref) => {
    const def = iconDefinitions[name];
    if (!def) return null;

    let resolvedWeight: PhosphorWeight;
    if (weight) {
      resolvedWeight = resolvePhosphorWeight(weight);
    } else if (type) {
      resolvedWeight = resolvePhosphorWeight(type);
    } else if (Number(stroke ?? strokeWidth) >= 2.2) {
      resolvedWeight = 'bold';
    } else if (stroke !== undefined || strokeWidth !== undefined ? Number(stroke ?? strokeWidth) <= 1.2 : false) {
      resolvedWeight = 'thin';
    } else {
      resolvedWeight = 'light';
    }

    const innerHtml =
      def[resolvedWeight] || def.light || def.thin || def.regular || def.duotone || def.fill || def.bold || '';
    if (!innerHtml) return null;

    const classes = ['ph-icon', `ph-icon-${name}`, className].filter(Boolean).join(' ');

    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 256 256"
        width={size}
        height={size}
        fill="currentColor"
        className={classes}
        dangerouslySetInnerHTML={{ __html: innerHtml }}
        {...props}
      />
    );
  }
);
PhosphorIcon.displayName = 'PhosphorIcon';

export const Majesticon = PhosphorIcon;

export function createIcon(name: PhosphorIconName, defaultWeight: PhosphorWeight = 'light') {
  const Component = forwardRef<SVGSVGElement, IconProps>((props, ref) => (
    <PhosphorIcon ref={ref} name={name} weight={props.weight ?? defaultWeight} {...props} />
  ));
  Component.displayName = `PhosphorIcon(${name})`;
  return Component;
}

// Named Icon exports mapped to Phosphor Icons (https://phosphoricons.com)
export const Folder = createIcon('folder');
export const FolderSimple = createIcon('folder-simple');
export const FolderOpen = createIcon('folder-open');

export const Briefcase = createIcon('briefcase');
export const BriefcaseBusiness = Briefcase;

export const Camera = createIcon('camera');
export const Photo = createIcon('image');
export const Image = Photo;
export const LibraryPhoto = createIcon('images');
export const Cpu = createIcon('cpu');

export const Certificate = createIcon('certificate');
export const Award = Certificate;
export const CertificateIcon = Certificate;
export const GraduationCap = createIcon('graduation-cap');
export const DocumentAward = GraduationCap;

export const Mail = createIcon('envelope-simple');
export const EnvelopeSimple = Mail;

export const ContactIcon = createIcon('address-book');
export const GearIcon = createIcon('gear-six');
export const Desktop = createIcon('desktop');
export const DeviceDesktop = Desktop;
export const Monitor = createIcon('monitor');
export const Devices = createIcon('devices');
export const User = createIcon('user');
export const Article = createIcon('article');
export const Notes = Article;
export const Notebook = createIcon('notebook');
export const CarouselHorizontal = createIcon('images-square');

export const ChevronRight = createIcon('caret-right');
export const CaretRight = ChevronRight;

export const ChevronLeft = createIcon('caret-left');
export const CaretLeft = ChevronLeft;

export const ChevronDown = createIcon('caret-down');
export const CaretDown = ChevronDown;

export const ChevronUp = createIcon('caret-up');
export const CaretUp = ChevronUp;

export const Close = createIcon('x');
export const X = Close;

export const Menu = createIcon('list');
export const List = Menu;

export const Clock = createIcon('clock');
export const Calendar = createIcon('calendar');
export const CalendarPlus = createIcon('calendar-plus');

export const Send = createIcon('paper-plane-tilt');
export const PaperPlaneTilt = Send;

export const ArrowRight = createIcon('arrow-right');
export const ArrowLeft = createIcon('arrow-left');
export const ArrowUp = createIcon('arrow-up');
export const ArrowDown = createIcon('arrow-down');

export const Open = createIcon('arrow-square-out');
export const ExternalLink = Open;
export const ArrowSquareOut = Open;
export const ArrowUpRight = createIcon('arrow-up-right');

export const CheckCircle = createIcon('check-circle');
export const CheckCircle2 = CheckCircle;
export const ClipboardCheck = createIcon('clipboard-text');
export const Check = createIcon('check');

export const Lock = createIcon('lock');
export const Eye = createIcon('eye');
export const EyeOff = createIcon('eye-slash');
export const Key = createIcon('key');
export const KeyRound = Key;

export const Shield = createIcon('shield');
export const ShieldCheck = createIcon('shield-check');

export const Sparkles = createIcon('sparkle');
export const Comet = createIcon('shooting-star');

export const Heart = createIcon('heart');
export const Chat = createIcon('chat-circle');
export const MessageCircle = Chat;
export const MessageSquare = createIcon('chat-text');

export const Globe = createIcon('globe');
export const Globe2 = Globe;

export const Laptop = createIcon('laptop');
export const MapPin = createIcon('map-pin');

export const Analytics = createIcon('chart-bar');
export const BarChart3 = Analytics;

export const Bookmark = createIcon('bookmark');
export const BookOpen = createIcon('book-open');
export const Book = BookOpen;

export const Music = createIcon('music-notes');
export const Play = createIcon('play-circle');
export const SkipBack = createIcon('skip-back-circle');
export const SkipForward = createIcon('skip-forward-circle');

export const Pulse = createIcon('pulse');
export const Dumbbell = createIcon('barbell');

export const Leaf = createIcon('leaf');
export const Trees = Leaf;

export const Cup = createIcon('coffee');
export const Utensils = createIcon('fork-knife');

export const MoreMenu = createIcon('dots-three');
export const GripHorizontal = createIcon('dots-six');

export const LayoutGrid = createIcon('squares-four');
export const SquaresFour = LayoutGrid;

export const Layers = createIcon('stack');
export const Stack = Layers;

export const Home = createIcon('house');
export const HomeSimple = Home;

export const FileText = createIcon('file-text');
export const Document = FileText;

export const Code = createIcon('code');
export const Compass = createIcon('compass');
export const Brain = createIcon('brain');
export const Workflow = createIcon('git-branch');
export const Plug = createIcon('plug');
export const CreditCard = createIcon('credit-card');
export const TrendingUp = createIcon('trend-up');
export const Zap = createIcon('lightning');
export const FlaskConical = createIcon('flask');
export const Copy = createIcon('copy');
export const Languages = createIcon('translate');

export const LinkedIn = createIcon('linkedin-logo');
export const Instagram = createIcon('instagram-logo');
export const GitHub = createIcon('github-logo');
export const Pexels = createIcon('camera');
