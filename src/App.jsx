import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthLayout, UserGuestLogin } from './pages/Layout.jsx';

import BuilderPage from './pages/BuilderPage.jsx';
import PreviewPage from './pages/PreviewPage.jsx';
import PublishPage from './pages/PublishPage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import HomePages from './pages/HomePages.jsx';

function App() {
  return (

    <Routes>
      {/* Login routes */}
      <Route element={<UserGuestLogin />}>
        <Route path='/login' element={<AuthPage mode="login" />} />
        <Route path='/register' element={<AuthPage mode="register" />} />
      </Route>
      {/* Protected Routes */}
      <Route element={<AuthLayout />}>
        <Route path='/' element={<HomePages />} />
        <Route path='/builder/:id' element={<BuilderPage />} />
        <Route path='/preview/:id' element={<PreviewPage />} />
        <Route path='/publish/:id' element={<PublishPage />} />
      </Route>
      <Route path='*' element={<Navigate to="/login" replace />} />
    </Routes>

  );
}
export default App;