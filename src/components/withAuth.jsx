import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function withAuth(Component) {
  return function AuthenticatedComponent(props) {
    const navigate = useNavigate();
    
    useEffect(() => {
      const isAdmin = localStorage.getItem('isAdmin') === 'true';
      if (!isAdmin) {
        navigate('/login');
      }
    }, [navigate]);

    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    return isAdmin ? <Component {...props} /> : null;
  };
}