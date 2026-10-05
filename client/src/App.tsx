import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import NotFoundScreen from './screens/NotFoundScreen';

const HomeScreen = lazy(() => import('./screens/home/HomeScreen'));
const LoginScreen = lazy(() => import('./screens/auth/LoginScreen'));
const RegisterScreen = lazy(() => import('./screens/auth/RegisterScreen'));
const ResetPasswordScreen = lazy(
  () => import('./screens/auth/ResetPasswordScreen'),
);
const ForgotPasswordScreen = lazy(
  () => import('./screens/auth/ForgotPasswordScreen'),
);
const OAuthCallbackScreen = lazy(
  () => import('./screens/auth/OAuthCallbackScreen'),
);
const ChatScreen = lazy(() => import('./screens/chat/ChatScreen'));
const TermsAndConditions = lazy(
  () => import('./screens/home/TermsAndConditionsScreen'),
);
const PrivacyPolicyScreen = lazy(
  () => import('./screens/home/PrivacyPolicyScreen'),
);

function App() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/register" element={<RegisterScreen />} />
        <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
        <Route path="/reset-password" element={<ResetPasswordScreen />} />
        <Route path="/oauth-callback" element={<OAuthCallbackScreen />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/chat" element={<ChatScreen />} />
          <Route path="/chat/:conversationId" element={<ChatScreen />} />
        </Route>
        <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyScreen />} />
        <Route path="*" element={<NotFoundScreen />} />
      </Routes>
    </Suspense>
  );
}

export default App;
