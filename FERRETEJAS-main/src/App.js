import Login from "./components/auth/login";
import Register from "./components/auth/register";
import Header from "./components/header";
import Home from "./components/home";
import ProductsForm from "./components/ProductsForm/ProductsForm";
import Inventario from "./components/Inventario/inventario";
import GenerarVenta from "./components/venta/GenerarVenta"; // Importa el componente GenerarVenta
import HistorialVentas from "./components/venta/HistorialVentas";
import { AuthProvider } from "./contexts/authContext";
import { useRoutes } from "react-router-dom";


function App() {
  const routesArray = [
    {
      path: "*",
      element: <Login />,
    },
    {
      path: "/login",
      element: <Login />,
    },
    {
      path: "/register",
      element: <Register />,
    },
    {
      path: "/home",
      element: <Home />,
    },
    {
      path: "/registro-producto",
      element: <ProductsForm />,
    },
    {
      path: "/inventario",
      element: <Inventario />,
    },
    {
      path: "/generarVenta", // Nueva ruta para GenerarVenta
      element: <GenerarVenta />,
    },
    {
      path: "/historialVentas", // Ruta para el historial de ventas
      element: <HistorialVentas />,
    },
  ];

  let routesElement = useRoutes(routesArray);

  return (
    <AuthProvider>
      <Header />
      <div className="w-full h-screen flex flex-col">{routesElement}</div>
    </AuthProvider>
  );
}

export default App;
