import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Al recargar la página siempre pide cómo se desea iniciar (Modo Prueba / Selección de Rol)
  const [user, setUser] = useState(null);

  const [terminal, setTerminal] = useState(() => {
    return localStorage.getItem('lubri_terminal') || 'Caja_1';
  });

  const [toasts, setToasts] = useState([]);

  // Limpiar cualquier sesión anterior al iniciar para garantizar que al recargar pregunte el modo
  useEffect(() => {
    localStorage.removeItem('lubri_user');
  }, []);

  const showToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const login = async (username, password, selectedTerminal = terminal, forceLogin = false) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario: username,
          password: password,
          terminal: selectedTerminal,
          forceLogin: forceLogin,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          sessionConflict: data.sessionConflict || false,
          activeTerminal: data.activeTerminal || '',
          message: data.message || 'Error al iniciar sesión',
        };
      }

      const userData = data.user;
      setUser(userData);
      setTerminal(selectedTerminal);
      localStorage.setItem('lubri_terminal', selectedTerminal);
      showToast(`¡Bienvenido, ${userData.nombre}!`, 'success');
      return { success: true };
    } catch (err) {
      return { success: false, message: 'Error de red al contactar al servidor.' };
    }
  };

  // Acceso Rápido Modo Demo / Prueba
  const quickDemoLogin = async (role = 'admin') => {
    const creds = role.toLowerCase() === 'admin'
      ? { user: 'admin', pass: 'admin123', label: '👑 Administrador' }
      : { user: 'cajero1', pass: 'cajero123', label: '👤 Usuario Normal (Cajero)' };

    const res = await login(creds.user, creds.pass, terminal, true);
    if (res.success) {
      showToast(`Modo Demo: Sesión iniciada como ${creds.label}`, 'success');
    }
    return res;
  };

  const switchDemoRole = async (targetRole) => {
    return quickDemoLogin(targetRole);
  };

  const logout = useCallback(async () => {
    if (user?.id) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        });
      } catch (e) {
        console.error('Error logging out:', e);
      }
    }
    setUser(null);
    localStorage.removeItem('lubri_user');
    showToast('Sesión finalizada con éxito.', 'info');
  }, [user, showToast]);

  // Guardian: periodically check session validity
  useEffect(() => {
    if (!user?.id || !user?.token) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/auth/verify-session?userId=${user.id}&token=${user.token}`);
        const data = await res.json();
        if (!data.valid) {
          showToast('Tu sesión fue cerrada porque este usuario ingresó desde otra terminal.', 'error', 6000);
          setUser(null);
          localStorage.removeItem('lubri_user');
        }
      } catch (e) {
        // Network offline or temporary blip
      }
    }, 25000);

    return () => clearInterval(interval);
  }, [user, showToast]);

  return (
    <AuthContext.Provider
      value={{
        user,
        terminal,
        setTerminal,
        login,
        quickDemoLogin,
        switchDemoRole,
        logout,
        showToast,
        toasts,
        removeToast,
        isAdmin: user?.rol === 'Admin',
        isEncargado: user?.rol === 'Admin' || user?.rol === 'Encargado',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
