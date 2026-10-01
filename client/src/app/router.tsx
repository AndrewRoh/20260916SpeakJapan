import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from './Layout';
import { LessonListPage } from '../features/listening/LessonListPage';
import { LessonGeneratorPage } from '../features/lesson-generator/LessonGeneratorPage';
import { ListeningPage } from '../features/listening/ListeningPage';
import { BookLibraryPage } from '../features/books/library/BookLibraryPage';
import { BookReaderPage } from '../features/books/reader/BookReaderPage';
import { SettingsPage } from '../features/settings/SettingsPage';

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <Layout />,
      children: [
        { index: true, element: <Navigate to="/listening" replace /> },
        { path: 'listening', element: <LessonListPage /> },
        { path: 'listening/new', element: <LessonGeneratorPage /> },
        { path: 'listening/:lessonId', element: <ListeningPage /> },
        { path: 'books', element: <BookLibraryPage /> },
        { path: 'books/:bookId', element: <BookReaderPage /> },
        { path: 'settings', element: <SettingsPage /> },
      ],
    },
  ],
  // GitHub Pages의 https://<user>.github.io/<repo>/ 서브패스에 맞춰 라우팅 기준을 옮긴다.
  // 로컬 개발(루트 '/')에서는 BASE_URL이 '/'라 영향이 없다.
  { basename: import.meta.env.BASE_URL },
);
