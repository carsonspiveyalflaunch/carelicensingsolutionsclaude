import { Suspense } from 'react';
import CourseSuccessClient from '../components/CourseSuccessClient';

export const metadata = {
  robots: { index: false, follow: false },
  title: 'Enrollment Successful - Care Licensing Solutions',
  description: 'Your course enrollment is complete. Welcome to the Operational Success Academy!',
};

export default function CourseSuccessPage() {
  return <Suspense fallback={null}>
      <CourseSuccessClient />
    </Suspense>;
}
