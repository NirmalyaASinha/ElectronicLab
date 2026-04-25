'use client';

import { PageTransition } from '@/components/dashboard/PageTransition';
import ProjectDetailClient from '@/components/projects/ProjectDetailClient';

export default function StudentProjectDetailPage({ params }: { params: { id: string } }) {
  return (
    <PageTransition>
      <ProjectDetailClient projectId={params.id} viewerRole="STUDENT" />
    </PageTransition>
  );
}
