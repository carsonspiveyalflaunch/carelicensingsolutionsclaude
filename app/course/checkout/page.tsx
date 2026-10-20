import CourseCheckoutClient from '../components/CourseCheckoutClient';

export const metadata = {
  title: 'Course Checkout - Care Licensing Solutions',
  description: 'Complete your enrollment in the Operational Success Academy',
  robots: { index: false, follow: false },
};

export default function CourseCheckoutPage() {
  return <CourseCheckoutClient />;
}
