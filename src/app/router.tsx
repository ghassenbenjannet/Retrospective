import { Navigate, Route, Routes } from 'react-router-dom';
import { ActionTrackingPage } from '@/pages/ActionTrackingPage';
import { CollaboratorsPage } from '@/pages/CollaboratorsPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { LiveSessionPage } from '@/pages/LiveSessionPage';
import { LoginPage } from '@/pages/LoginPage';
import { SessionCreatePage } from '@/pages/SessionCreatePage';
import { SessionHistoryPage } from '@/pages/SessionHistoryPage';
import { TemplateEditorPage } from '@/pages/TemplateEditorPage';
import { TemplateLibraryPage } from '@/pages/TemplateLibraryPage';

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/collaborators" element={<CollaboratorsPage />} />
      <Route path="/templates" element={<TemplateLibraryPage />} />
      <Route path="/templates/edit/:templateId" element={<TemplateEditorPage />} />
      <Route path="/session/create" element={<SessionCreatePage />} />
      <Route path="/session/live/:sessionId" element={<LiveSessionPage />} />
      <Route path="/actions" element={<ActionTrackingPage />} />
      <Route path="/sessions" element={<SessionHistoryPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
