import { usePermissions } from "./PermissionsProvider";

function Forbidden() {
  return (
    <section style={{ padding: 24 }}>
      <h2>Sin acceso</h2>
      <p style={{ marginTop: 8 }}>
        Tu rol no tiene permiso para ver esta seccion. Si crees que es un error,
        contacta al administrador.
      </p>
    </section>
  );
}

function Loading() {
  return (
    <section style={{ padding: 24 }}>
      <p>Cargando permisos…</p>
    </section>
  );
}

/**
 * Route guard: blocks access by URL when the user lacks the required permission.
 * Defense-in-depth on top of the backend (which already returns 403). While
 * permissions are still loading we avoid a false "forbidden" flash.
 */
export default function RequirePermission({ perm, children }) {
  const { can, loaded } = usePermissions();

  if (perm && !loaded) return <Loading />;
  if (perm && !can(perm)) return <Forbidden />;
  return children;
}
