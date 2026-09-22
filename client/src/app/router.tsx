import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from './Layout';
import { LessonListPage } from '../features/listening/LessonListPage';
import { LessonGeneratorPage } from '../features/lesson-generator/LessonGeneratorPage';
import { ListeningPage } from '../features/listening/ListeningPage';
import { BookLibraryPage } from '../features/books/library/BookLibraryPage';
import { BookReaderPage } from '../features/books/reader/BookReaderPage';
import { SettingsPage } from '../features/settings/SettingsPage';

export const router = createBrowserRouter([
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
]);
