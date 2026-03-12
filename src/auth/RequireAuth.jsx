import { useMemo } from "react";
import { useAuth } from "./AuthProvider";
import { cognitoConfig } from "./cognitoConfig";

function MissingConfig() {
  return (
    <section style={{ padding: 24 }}>
      <h2>Falta configurar Cognito</h2>
      <p style={{ marginTop: 8 }}>
        Revisa tu archivo <code>.env</code> y completa:
      </p>
      <pre style={{ marginTop: 12, whiteSpace: "pre-wrap" }}>
        {`VITE_COGNITO_DOMAIN=...\nVITE_COGNITO_CLIENT_ID=...\nVITE_COGNITO_REDIRECT_URI=http://localhost:5173/auth/callback`}
      </pre>
    </section>
  );
}

function LoginScreen() {
  const { login } = useAuth();

  return (
    <section style={{ padding: 24 }}>
      <h2>Inicia sesion</h2>
      <p style={{ marginTop: 8 }}>
        Necesitas autenticarte para acceder a MisterCheck.
      </p>
      <div style={{ marginTop: 16 }}>
        <button type="button" className="btn" onClick={login}>
          Iniciar sesion con Cognito
        </button>
      </div>
    </section>
  );
}

export default function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();

  const hasConfig = useMemo(() => {
    return Boolean(cognitoConfig.domain && cognitoConfig.clientId);
  }, []);

  if (!hasConfig) return <MissingConfig />;
  if (!isAuthenticated) return <LoginScreen />;
  return children;
}
