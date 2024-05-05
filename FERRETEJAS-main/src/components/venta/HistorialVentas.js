import React, { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, doc, deleteDoc } from 'firebase/firestore';

const HistorialVentas = () => {
    const [ventas, setVentas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [ventaSeleccionada, setVentaSeleccionada] = useState(null);

    useEffect(() => {
        const fetchVentas = async () => {
            try {
                const db = getFirestore();
                const ventasCollectionRef = collection(db, 'ventas');
                const querySnapshot = await getDocs(ventasCollectionRef);
                const ventasData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setVentas(ventasData);
                setLoading(false);
            } catch (error) {
                console.error('Error al obtener historial de ventas:', error);
                setLoading(false);
            }
        };

        fetchVentas();
    }, []);

    const handleVerDetalleVenta = (ventaId) => {
        // Buscar la venta seleccionada
        const venta = ventas.find(venta => venta.id === ventaId);
        setVentaSeleccionada(venta);
    };

    const handleEliminarVenta = async (id) => {
        try {
            const db = getFirestore();
            const ventaDocRef = doc(db, 'ventas', id);
            await deleteDoc(ventaDocRef);
            setVentas(ventas.filter(venta => venta.id !== id));
        } catch (error) {
            console.error('Error al eliminar la venta:', error);
        }
    };

    if (loading) {
        return <p>Cargando historial de ventas...</p>;
    }

    return (
        <div>
            <h2>Historial de Ventas</h2>
            <ul>
                {ventas.map(venta => (
                    <li key={venta.id}>
                        <p>Fecha: {venta.fecha.toDate().toLocaleString()}</p>
                        <p>Total: ${venta.totalVenta.toFixed(2)}</p>
                        <button onClick={() => handleVerDetalleVenta(venta.id)}>Ver Detalle</button>
                        <button onClick={() => handleEliminarVenta(venta.id)}>Eliminar Venta</button>
                    </li>
                ))}
            </ul>
            {ventaSeleccionada && ventaSeleccionada.productos && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close" onClick={() => setVentaSeleccionada(null)}>&times;</span>
                        <h3>Detalle de la Venta</h3>
                        <p>Fecha: {ventaSeleccionada.fecha && ventaSeleccionada.fecha.toDate().toLocaleString()}</p>
                        <p>Total: ${ventaSeleccionada.totalVenta && ventaSeleccionada.totalVenta.toFixed(2)}</p>
                        <h4>Productos:</h4>
                        <ul>
                            {ventaSeleccionada.productos.map((producto, index) => (
                                <li key={index}>
                                    <p>Nombre: {producto.name}</p>
                                    <p>Precio Unitario: ${producto.conIva && producto.conIva.toFixed(2)}</p>
                                    <p>Cantidad: {producto.cantidad}</p>
                                    <p>Total: ${producto.conIva && producto.cantidad && producto.conIva * producto.cantidad}</p>
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