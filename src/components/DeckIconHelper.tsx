import React from 'react';
import { 
  ShieldAlert, 
  Scale, 
  Gavel, 
  FileText, 
  Landmark, 
  Lock, 
  BookOpen, 
  Briefcase, 
  GraduationCap, 
  Award, 
  Bookmark, 
  Folder, 
  Sparkles, 
  Scroll, 
  Users, 
  Building2, 
  Coins, 
  HeartHandshake, 
  Compass, 
  AlertCircle,
  HelpCircle,
  LucideIcon
} from 'lucide-react';

export interface IconOption {
  name: string;
  label: string;
  component: LucideIcon;
}

export const DECK_ICON_OPTIONS: IconOption[] = [
  { name: 'Scale', label: 'ตราชู (ความยุติธรรม)', component: Scale },
  { name: 'Gavel', label: 'ค้อนศาล (วิธีพิจารณา)', component: Gavel },
  { name: 'ShieldAlert', label: 'โล่ป้องกัน (อาญา/ความปลอดภัย)', component: ShieldAlert },
  { name: 'FileText', label: 'เอกสาร/สัญญา', component: FileText },
  { name: 'Landmark', label: 'รัฐธรรมนูญ/สถาบัน', component: Landmark },
  { name: 'Lock', label: 'กุญแจ (ข้อมูลส่วนบุคคล/ความลับ)', component: Lock },
  { name: 'BookOpen', label: 'ตำรา/หนังสือ', component: BookOpen },
  { name: 'Briefcase', label: 'กระเป๋าทำงาน (แรงงาน/พาณิชย์)', component: Briefcase },
  { name: 'GraduationCap', label: 'การศึกษา/สอบเนติ', component: GraduationCap },
  { name: 'Award', label: 'เหรียญรางวัล/เกียรติประวัติ', component: Award },
  { name: 'Bookmark', label: 'คั่นหน้า/มาตราสำคัญ', component: Bookmark },
  { name: 'Folder', label: 'แฟ้มเอกสาร', component: Folder },
  { name: 'Sparkles', label: 'พิเศษ/คัดเก็ง', component: Sparkles },
  { name: 'Scroll', label: 'ม้วนคัมภีร์/บทกฎหมาย', component: Scroll },
  { name: 'Users', label: 'บุคคล/ครอบครัว/มรดก', component: Users },
  { name: 'Building2', label: 'ทรัพย์สิน/อสังหาริมทรัพย์', component: Building2 },
  { name: 'Coins', label: 'ภาษี/การเงิน/ล้มละลาย', component: Coins },
  { name: 'HeartHandshake', label: 'นิติกรรม/ข้อตกลง', component: HeartHandshake },
  { name: 'Compass', label: 'ปกครอง/ระเบียบ', component: Compass },
  { name: 'AlertCircle', label: 'ข้อควรจำ/ฎีกาเตือน', component: AlertCircle },
];

export const renderDeckIcon = (iconName: string, className: string = 'w-5 h-5') => {
  switch (iconName) {
    case 'ShieldAlert':
      return <ShieldAlert className={className} />;
    case 'Scale':
      return <Scale className={className} />;
    case 'Gavel':
      return <Gavel className={className} />;
    case 'FileText':
      return <FileText className={className} />;
    case 'Landmark':
      return <Landmark className={className} />;
    case 'Lock':
      return <Lock className={className} />;
    case 'Briefcase':
      return <Briefcase className={className} />;
    case 'GraduationCap':
      return <GraduationCap className={className} />;
    case 'Award':
      return <Award className={className} />;
    case 'Bookmark':
      return <Bookmark className={className} />;
    case 'Folder':
      return <Folder className={className} />;
    case 'Sparkles':
      return <Sparkles className={className} />;
    case 'Scroll':
      return <Scroll className={className} />;
    case 'Users':
      return <Users className={className} />;
    case 'Building2':
      return <Building2 className={className} />;
    case 'Coins':
      return <Coins className={className} />;
    case 'HeartHandshake':
      return <HeartHandshake className={className} />;
    case 'Compass':
      return <Compass className={className} />;
    case 'AlertCircle':
      return <AlertCircle className={className} />;
    default:
      return <BookOpen className={className} />;
  }
};
