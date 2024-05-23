import React from 'react';
import { useAuth } from '../../contexts/authContext';
import { Link } from 'react-router-dom';
import './home.css';

const Home = () => {
    const { currentUser, isAdmin } = useAuth();

    if (!currentUser) {
        // Mostrar un mensaje de carga o redirigir a la página de login si currentUser es null
        return <div>Cargando...</div>;
    }

    return (
        <div className='flex flex-col items-center justify-center mt-2 mb-2 h-screen'>
            <div className='text-2xl font-bold'>
                Bienvenido {currentUser.displayName ? currentUser.displayName : currentUser.email}
            </div>
            <div className='text-xl font-bold mt-2'>
                a la aplicación de Ferretejas.
            </div>
            <div className="flex flex-row items-center mt-4">
                {/* Mostrar solo si el usuario es administrador */}
                {isAdmin && (
                    <Link to="/registro-producto" className="card-link">
                        <button className="card-button">
                            Registrar y editar productos
                        </button>
                    </Link>
                )}

                {/* Mostrar para cualquier usuario autenticado */}
                <Link to="/inventario" className="card-link">
                    <button className="card-button">
                        Ver el inventario con costos
                    </button>
                </Link>

                {/* Nuevo botón para "Generar venta" */}
                <Link to="/generarVenta" className="card-link">
                    <button className="card-button">
                        Generar venta
                    </button>
                </Link>

                {/* Agregar un botón para ir al historial de ventas */}
                <Link to="/historialVentas" className="card-link">
                    <button className="card-button">
                        Historial Ventas
                    </button>
                </Link>

                {/* Mostrar para cualquier usuario autenticado */}
                <Link to="/cotizacion" className="card-link">
                    <button className="card-button">
                        Generar Venta sin Margen
                    </button>
                </Link>
            </div>

        </div>
    );
}

export default Home;
