import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { UserGuestLogin, AuthPage } from './pages/AuthPage';
import BuilderPage from './pages/BuilderPage';
import PreviewPage from './pages/PreviewPage';
import PublishPage from './pages/PublishPage';
import HomePages from './pages/HomePages';

function App() {
  return (

    <Routes>
      {/* Login routes */}
      <Route element={<UserGuestLogin />}>
        <Route path='/login' element={<AuthPage mode="login" />} />
        <Route path='/register' element={<AuthPage mode="register" />} />
      </Route>
      {/* Protected Routes */}
      <Route element={<AuthPage />}>
        <Route path='/' element={<HomePages />} />
        <Route path='/builder/:id' element={<BuilderPage />} />
        <Route path='/preview/:id' element={<PreviewPage />} />
        <Route path='/publish/:id' element={<PublishPage />} />
      </Route>
    </Routes>

  );
}
export default App;