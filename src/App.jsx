import { BrowserRouter, Route, Routes } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import LandingPage from "./pages/landing/LandingPage";
import AuthCallback from "./pages/AuthCallback";
import RequireAuth from "./auth/RequireAuth";
import RequirePermission from "./auth/RequirePermission";
import Home from "./pages/Home";
import Inventario from "./pages/Inventario";
import EditarProducto from "./pages/EditarProducto";
import NuevoProducto from "./pages/NuevoProducto";
import CotizacionNueva from "./pages/CotizacionNueva";
import Clientes from "./pages/Clientes";
import Configuracion from "./pages/Configuracion";
import Reportes from "./pages/Reportes";
import Herramientas from "./pages/Herramientas";
import AsignarHerramientas from "./pages/AsignarHerramientas";
import AsignarProyecto from "./pages/AsignarProyecto";
import Agenda from "./pages/Agenda";
import { InventoryProvider } from "./store/inventoryStore";
import { ClientProvider } from "./store/clientStore";
import { QuoteProvider } from "./store/quoteStore";
import { ToolProvider } from "./store/toolStore";
import { WorkerProvider } from "./store/workerStore";
import { AssignmentProvider } from "./store/assignmentStore";
import { ProjectAssignmentProvider } from "./store/projectAssignmentStore";
import { AgendaProvider } from "./store/agendaStore";
import { AuthProvider } from "./auth/AuthProvider";
import { PermissionsProvider } from "./auth/PermissionsProvider";

export default function App() {
  return (
    <AuthProvider>
      <PermissionsProvider>
        <InventoryProvider>
          <ClientProvider>
            <QuoteProvider>
              <ToolProvider>
                <WorkerProvider>
                  <AssignmentProvider>
                    <ProjectAssignmentProvider>
                      <AgendaProvider>
                        <BrowserRouter>
                          <Routes>
                            <Route path="/auth/callback" element={<AuthCallback />} />
                            <Route path="/landing" element={<LandingPage />} />
                            <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
                              <Route path="/" element={<Home />} />
                              <Route
                                path="/inventario"
                                element={
                                  <RequirePermission perm="products:read">
                                    <Inventario />
                                  </RequirePermission>
                                }
                              />
                              <Route
                                path="/inventario/nuevo"
                                element={
                                  <RequirePermission perm="products:create">
                                    <NuevoProducto />
                                  </RequirePermission>
                                }
                              />
                              <Route
                                path="/inventario/editar/:productId"
                                element={
                                  <RequirePermission perm="products:update">
                                    <EditarProducto />
                                  </RequirePermission>
                                }
                              />
                              <Route
                                path="/cotizaciones/nueva"
                                element={
                                  <RequirePermission perm="quotes:create">
                                    <CotizacionNueva />
                                  </RequirePermission>
                                }
                              />
                              <Route
                                path="/cotizaciones/:quoteId"
                                element={
                                  <RequirePermission perm="quotes:read">
                                    <CotizacionNueva />
                                  </RequirePermission>
                                }
                              />
                              <Route
                                path="/clientes"
                                element={
                                  <RequirePermission perm="clients:read">
                                    <Clientes />
                                  </RequirePermission>
                                }
                              />
                              <Route
                                path="/reportes"
                                element={
                                  <RequirePermission perm="quotes:read">
                                    <Reportes />
                                  </RequirePermission>
                                }
                              />
                              <Route
                                path="/herramientas"
                                element={
                                  <RequirePermission perm="tools:read">
                                    <Herramientas />
                                  </RequirePermission>
                                }
                              />
                              <Route
                                path="/herramientas/asignar"
                                element={
                                  <RequirePermission perm="assignments:write">
                                    <AsignarHerramientas />
                                  </RequirePermission>
                                }
                              />
                              <Route
                                path="/proyectos/asignar"
                                element={
                                  <RequirePermission perm="project-assignments:write">
                                    <AsignarProyecto />
                                  </RequirePermission>
                                }
                              />
                              <Route
                                path="/agenda"
                                element={
                                  <RequirePermission perm="agenda:read">
                                    <Agenda />
                                  </RequirePermission>
                                }
                              />
                              <Route path="/configuracion" element={<Configuracion />} />
                            </Route>
                          </Routes>
                        </BrowserRouter>
                      </AgendaProvider>
                    </ProjectAssignmentProvider>
                  </AssignmentProvider>
                </WorkerProvider>
              </ToolProvider>
            </QuoteProvider>
          </ClientProvider>
        </InventoryProvider>
      </PermissionsProvider>
    </AuthProvider>
  );
}
