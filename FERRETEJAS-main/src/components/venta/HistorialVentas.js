import React, { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, doc, deleteDoc, getDoc, query, orderBy, updateDoc } from 'firebase/firestore';
import './HistorialVentas.css'; // Importa el archivo de estilos

const HistorialVentas = () => {
    const [ventas, setVentas] = useState([]);
    const [cotizaciones, setCotizaciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
    const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const db = getFirestore();

                const ventasCollectionRef = collection(db, 'ventas');
                const ventasQuerySnapshot = await getDocs(ventasCollectionRef);
                const ventasData = ventasQuerySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                ventasData.sort((a, b) => b.fecha.seconds - a.fecha.seconds);

                setVentas(ventasData);

                const cotizacionesCollectionRef = collection(db, 'quotations');
                const cotizacionesQuerySnapshot = await getDocs(cotizacionesCollectionRef);
                const cotizacionesData = cotizacionesQuerySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setCotizaciones(cotizacionesData);

                setLoading(false);
            } catch (error) {
                console.error('Error al obtener datos:', error);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleVerDetalleVenta = (ventaId) => {
        const venta = ventas.find(venta => venta.id === ventaId);
        setVentaSeleccionada(venta);
    };

    const handleVerDetalleCotizacion = (cotizacionId) => {
        const cotizacion = cotizaciones.find(cotizacion => cotizacion.id === cotizacionId);
        setCotizacionSeleccionada(cotizacion);
    };

    const cargarProductosExistentes = async () => {
        try {
            const db = getFirestore();
            const q = query(collection(db, 'products'), orderBy('name'));
            const querySnapshot = await getDocs(q);
            const productos = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            return productos;
        } catch (error) {
            console.error('Error al obtener productos existentes:', error);
            throw new Error('Error al obtener productos existentes');
        }
    };

    const handleEliminarVenta = async (id) => {
        try {
            const db = getFirestore();

            // Obtener la venta que se va a eliminar
            const ventaDocRef = doc(db, 'ventas', id);
            const ventaDocSnapshot = await getDoc(ventaDocRef);
            const ventaData = ventaDocSnapshot.data();

            if (!ventaData) {
                console.error('La venta con ID', id, 'no existe.');
                return;
            }

            // Cargar los productos existentes
            const productosExistentes = await cargarProductosExistentes();

            // Restaurar el stock de cada producto en la venta
            const productosVenta = ventaData.productos || [];
            
            for (const producto of productosVenta) {
                console.log(producto.nombre);
                const productoExistente = productosExistentes.find(p => p.name.toLowerCase() === producto.nombre.toLowerCase());
                if (productoExistente) {
                    const nuevaCantidad = producto.stock; // Suponiendo que `producto.cantidad` es la cantidad vendida
                    if (productoExistente.id) {
                        const productoRef = doc(db, 'products', productoExistente.id);
                        await updateDoc(productoRef, {
                            stock: nuevaCantidad
                        });
                        console.log(`Stock del producto con ID ${productoExistente.id} actualizado a ${nuevaCantidad}`);
                    } else {
                        console.log('ID de producto no válido:', producto.id);
                    }
                } else {
                    console.log('Producto no encontrado:', producto.nombre);
                }
            }

            // Eliminar la venta de la base de datos
            await deleteDoc(ventaDocRef);

            // Actualizar el estado de ventas en la interfaz de usuario
            setVentas(ventas.filter(venta => venta.id !== id));

            alert('Venta eliminada con éxito');
        } catch (error) {
            alert('Error al eliminar la venta:', error);
        }
    };

    const handleEliminarCotizacion = async (id) => {
        try {
            const db = getFirestore();
            const cotizacionDocRef = doc(db, 'quotations', id);
            await deleteDoc(cotizacionDocRef);
            setCotizaciones(cotizaciones.filter(cotizacion => cotizacion.id !== id));
        } catch (error) {
            console.error('Error al eliminar la cotización:', error);
        }
    };

    if (loading) {
        return <p>Cargando datos...</p>;
    }

    return (
        <div className="historial-ventas-container">
            <h2>Historial de Ventas</h2>
            <ul className="ventas-list">
                {ventas.map(venta => (
                    <li key={venta.id} className="venta-item">
                        <p>Fecha: {new Date(venta.fecha.seconds * 1000).toLocaleString()}</p>
                        <p>Total: ${Number(venta.totalVenta).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        <div className="venta-buttons">
                            <button onClick={() => handleVerDetalleVenta(venta.id)}>Ver Detalle</button>
                            <button onClick={() => handleEliminarVenta(venta.id)}>Eliminar Venta</button>
                        </div>
                    </li>
                ))}
            </ul>

            {ventaSeleccionada && ventaSeleccionada.productos && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close" onClick={() => setVentaSeleccionada(null)}>&times;</span>
                        <h3>Detalle de la Venta</h3>
                        <p>Fecha: {ventaSeleccionada.fecha && new Date(ventaSeleccionada.fecha.seconds * 1000).toLocaleString()}</p>
                        <p>Total: ${Number(ventaSeleccionada.totalVenta).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        <h4>Productos:</h4>
                        <ul>
                            {ventaSeleccionada.productos.map((producto, index) => (
                                <li key={index}>
                                    <p>Nombre: {producto.nombre}</p>
                                    <p>Precio de Compra: ${Number(producto.precioCompra).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                    <p>Precio sin IVA: ${Number(producto.precioSinIva).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                    <p>Cantidad: {producto.cantidad}</p>
                                    <p>Stock: {producto.stock}</p>
                                    <p>Total Producto: ${Number(producto.totalProducto).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            <h2>Historial de Venta sin Margen</h2>
            <ul className="cotizaciones-list">
                {cotizaciones.map(cotizacion => (
                    <li key={cotizacion.id} className="cotizacion-item">
                        <p>Fecha: {new Date(cotizacion.date.seconds * 1000).toLocaleString()}</p>
                        <p>Total: ${Number(cotizacion.totalPrice).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        <div className="cotizacion-buttons">
                            <button onClick={() => handleVerDetalleCotizacion(cotizacion.id)}>Ver Detalle</button>
                            <button onClick={() => handleEliminarCotizacion(cotizacion.id)}>Eliminar Venta</button>
                        </div>
                    </li>
                ))}
            </ul>

            {cotizacionSeleccionada && cotizacionSeleccionada.products && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close" onClick={() => setCotizacionSeleccionada(null)}>&times;</span>
                        <h3>Detalle de la Venta</h3>
                        <p>Fecha: {cotizacionSeleccionada.date && new Date(cotizacionSeleccionada.date.seconds * 1000).toLocaleString()}</p>
                        <p>Total: ${Number(cotizacionSeleccionada.totalPrice).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        
                        <h4>Productos:</h4>
                        <ul>
                            {cotizacionSeleccionada.products.map((producto, index) => (
                                <li key={index}>
                                    <p>Nombre: {producto.name}</p>
                                    <p>Cantidad: {producto.quantity}</p>
                                    <p>Precio: ${Number(producto.price).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                    <p>Total Producto: ${Number(producto.totalPrice).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HistorialVentas;
