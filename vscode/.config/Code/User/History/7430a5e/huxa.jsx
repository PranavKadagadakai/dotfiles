import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useContext(AuthContext);

  if (loading) return null; // or a spinner

  if (!user) {
    window.location.replace('/login');
    return null;
  }

  return children;
}