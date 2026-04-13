import { BrowserRouter, Route, Routes } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import LandingPage from "./pages/landing/LandingPage";
import AuthCallback from "./pages/AuthCallback";
import RequireAuth from "./auth/RequireAuth";
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

export default function App() {
  return (
    <AuthProvider>
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
                          <Route path="/inventario" element={<Inventario />} />
                          <Route
                            path="/inventario/nuevo"
                            element={<NuevoProducto />}
                          />
                          <Route
                            path="/inventario/editar/:productId"
                            element={<EditarProducto />}
                          />
                          <Route
                            path="/cotizaciones/nueva"
                            element={<CotizacionNueva />}
                          />
                          <Route
                            path="/cotizaciones/:quoteId"
                            element={<CotizacionNueva />}
                          />
                          <Route path="/clientes" element={<Clientes />} />
                          <Route path="/reportes" element={<Reportes />} />
                          <Route path="/herramientas" element={<Herramientas />} />
                          <Route
                            path="/herramientas/asignar"
                            element={<AsignarHerramientas />}
                          />
                          <Route path="/proyectos/asignar" element={<AsignarProyecto />} />
                          <Route path="/agenda" element={<Agenda />} />
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
    </AuthProvider>
  );
}
