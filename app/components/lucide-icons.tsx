// Centralized Lucide icons for program types
import {
  Home,
  Stethoscope,
  Sun,
  Accessibility,
  Building2,
  Baby,
  HomeIcon,
  Hospital,
  HeartPulse,
  HeartHandshake
} from "lucide-react";

export const programTypeIcons: { [key: string]: React.ReactNode } = {
  "Assisted Living Facilities": <Building2 className="w-5 h-5" />,
  "Nursing Facilities (SNF)": <Hospital className="w-5 h-5" />,
  "Home Health Agencies": <HeartPulse className="w-5 h-5" />,
  "Adult Day Care Programs": <Sun className="w-5 h-5" />,
  "Hospice Programs": <HeartHandshake className="w-5 h-5" />,
  "Child Care Facilities": <Baby className="w-5 h-5" />,
  "Group Homes for Children": <Home className="w-5 h-5" />,
  "Personal Home Care": <Stethoscope className="w-5 h-5" />,
  "Residential Care (DD)": <Accessibility className="w-5 h-5" />,
  "Residential Treatment (Children)": <HomeIcon className="w-5 h-5" />
};
