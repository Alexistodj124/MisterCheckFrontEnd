import { BrowserRouter, Route, Routes } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import Home from "./pages/Home";
import Inventario from "./pages/Inventario";
import EditarProducto from "./pages/EditarProducto";
import NuevoProducto from "./pages/NuevoProducto";
import CotizacionNueva from "./pages/CotizacionNueva";
import Clientes from "./pages/Clientes";
import Configuracion from "./pages/Configuracion";
import Reportes from "./pages/Reportes";
import Herramientas from "./pages/Herramientas";
import { InventoryProvider } from "./store/inventoryStore";
import { ClientProvider } from "./store/clientStore";
import { QuoteProvider } from "./store/quoteStore";
import { ToolProvider } from "./store/toolStore";

export default function App() {
  return (
    <InventoryProvider>
      <ClientProvider>
        <QuoteProvider>
          <ToolProvider>
            <BrowserRouter>
              <Routes>
                <Route element={<AppLayout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/inventario" element={<Inventario />} />
                  <Route path="/inventario/nuevo" element={<NuevoProducto />} />
                  <Route
                    path="/inventario/editar/:productId"
                    element={<EditarProducto />}
                  />
                  <Route path="/cotizaciones/nueva" element={<CotizacionNueva />} />
                  <Route path="/clientes" element={<Clientes />} />
                  <Route path="/reportes" element={<Reportes />} />
                  <Route path="/herramientas" element={<Herramientas />} />
                  <Route path="/configuracion" element={<Configuracion />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </ToolProvider>
        </QuoteProvider>
      </ClientProvider>
    </InventoryProvider>
  );
}
