import { useEffect, useState } from 'react';

export default function Debug() {
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const roles = Array.isArray(user?.roles) ? user.roles : (user?.role ? [user.role] : []);
    
    setDebugInfo({
      token: token ? 'Present' : 'Missing',
      user: user,
      roles: roles,
      isRider: roles.includes('rider'),
      isDriver: roles.includes('driver')
    });
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Debug Info</h1>
      <pre className="bg-gray-100 p-4 rounded">
        {JSON.stringify(debugInfo, null, 2)}
      </pre>
    </div>
  );
}
