import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import LoginScreen from './screens/auth/LoginScreen';
import RegisterScreen from './screens/auth/RegisterScreen';
import ForgotPasswordScreen from './screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from './screens/auth/ResetPasswordScreen';
import OAuthCallbackScreen from './screens/auth/OAuthCallbackScreen';
import ChatScreen from './screens/chat/ChatScreen';
import NotFoundScreen from './screens/NotFoundScreen';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/chat" replace />} />
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/register" element={<RegisterScreen />} />
      <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
      <Route path="/reset-password" element={<ResetPasswordScreen />} />
      <Route path="/oauth-callback" element={<OAuthCallbackScreen />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/chat" element={<ChatScreen />} />
        <Route path="/chat/:conversationId" element={<ChatScreen />} />
      </Route>
      <Route path="*" element={<NotFoundScreen />} />
    </Routes>
  );
}

export default App;
