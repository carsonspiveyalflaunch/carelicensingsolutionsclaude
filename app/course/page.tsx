import Header from "../components/Header";
import Footer from "../components/Footer";
import CoursePageHeroSection from "./components/CoursePageHeroSection";
import CourseCommunitySection from "./components/CourseCommunitySection";
import CourseStatsSection from "./components/CourseStatsSection";
import CourseCurriculumSection from "./components/CourseCurriculumSection";
import CoursePageCTA from "../components/CoursePageCTA";

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
