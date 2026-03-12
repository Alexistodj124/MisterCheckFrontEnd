import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { exchangeCodeForTokens } from "../auth/cognitoClient";
import { useAuth } from "../auth/AuthProvider";

export default function AuthCallback() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const { setTokensFromCognito } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    const run = async () => {
      const code = params.get("code");
      const err = params.get("error");
      const desc = params.get("error_description");

      if (err) {
        setError(`${err}${desc ? `: ${desc}` : ""}`);
        return;
      }
      if (!code) {
        setError("Missing code");
        return;
      }

      try {
        const tokens = await exchangeCodeForTokens(code);
        setTokensFromCognito(tokens);
        nav("/", { replace: true });
      } catch (e) {
        setError(String(e?.message || e));
      }
    };
    run();
  }, [params, nav, setTokensFromCognito]);

  return (
    <section style={{ padding: 24 }}>
      <h2>Autenticando...</h2>
      {error ? <div style={{ marginTop: 12, color: "crimson" }}>{error}</div> : null}
    </section>
  );
}
