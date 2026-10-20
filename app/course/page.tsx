import Header from "../components/Header";
import Footer from "../components/Footer";
import CoursePageHeroSection from "./components/CoursePageHeroSection";
import CourseCommunitySection from "./components/CourseCommunitySection";
import CourseStatsSection from "./components/CourseStatsSection";
import CourseCurriculumSection from "./components/CourseCurriculumSection";
import CoursePageCTA from "../components/CoursePageCTA";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta('/course', 'Operational Success Academy: Launch & Run a Care Business | Care Licensing Solutions', 'An 11-module online course on launching and operating a licensed care business, from licensing and staffing to billing and compliance. Learn at your own pace.');

export default function CoursePage() {
  return (
    <>
      <Header />
      <CoursePageHeroSection />
      <CourseStatsSection />
      <CourseCommunitySection />
      <CourseCurriculumSection />
      <CoursePageCTA />
      <Footer />
    </>
  );
}
