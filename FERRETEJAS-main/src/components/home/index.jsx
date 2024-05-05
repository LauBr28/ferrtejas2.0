import React from 'react';
import { useAuth } from '../../contexts/authContext';
import { Link } from 'react-router-dom';

const Home = () => {
    const { currentUser, isAdmin } = useAuth();

    return (
        <div className='flex flex-col items-center justify-center h-screen'>
            <div className='text-2xl font-bold'>
                Bienvenido {currentUser.displayName ? currentUser.displayName : currentUser.email} 
            </div>
            <div className='text-xl font-bold mt-2'>
                a la aplicación de Ferretejas.
            </div>
            <div className="flex flex-col items-center mt-4">
                {/* Mostrar solo si el usuario es administrador */}
                {isAdmin && (
                    <Link to="/registro-producto">
                        <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 mb-2">
                            Registrar y editar productos
                        </button>
                    </Link>
                )}

                {/* Mostrar para cualquier usuario autenticado */}
                <Link to="/inventario">
                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 mb-2">
                        Ver el inventario con costos
                    </button>
                </Link>

                {/* Nuevo botón para "Generar venta" */}
                <Link to="/generarVenta">
                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 mb-2">
                        Generar venta
                    </button>
                    </Link>
                    {/* Agregar un botón para ir al historial de ventas */}
                <Link to="/historialVentas">
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 mb-2">
                        Historial Ventas
                    </button>
                </Link>
            </div>
        </div>
    );
}

export default Home;
