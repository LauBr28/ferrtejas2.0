import React, { useState, useEffect } from 'react';
import { getFirestore, collection, addDoc, query, getDocs, where, orderBy } from 'firebase/firestore';
import './GenerarVenta.css'; // Importa el archivo de estilos

const GenerarVenta = () => {
    const [nombre, setNombre] = useState('');
    const [precioCompra, setPrecioCompra] = useState('');
    const [precioSinIva, setPrecioSinIva] = useState('');
    const [cantidad, setCantidad] = useState('');
    const [stock, setStock] = useState('');
    const [total, setTotal] = useState(0);
    const [productos, setProductos] = useState([]); // Estado para almacenar productos
    const [totalVenta, setTotalVenta] = useState(0); // Estado para el total de la venta
    const [mostrarAgregarProductos, setMostrarAgregarProductos] = useState(false);
    const [mostrarTotalVenta, setMostrarTotalVenta] = useState(false);
    const [numeroProducto, setNumeroProducto] = useState(0);
    const [mostrarListaProductos, setMostrarListaProductos] = useState(false);
    const [productosExistentes, setProductosExistentes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [mostrarTablaProductos, setMostrarTablaProductos] = useState(false);
    const [mostrarMensajeExito, setMostrarMensajeExito] = useState(false);
    const [mostrarGuardarVenta, setMostrarGuardarVenta] = useState(false);
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [margenContribucion, setMargenContribucion] = useState('');
    const [margenDescuento, setMargenDescuento] = useState('');
    const [margenContMin, setMargenContMin] = useState('');
    const [recomendadoMin, setRecomendadoMin] = useState('');

    const handleAgregarProducto = () => {
        const nuevosProductos = [...productos];
        const camposVacios = nuevosProductos.some(
            producto => !producto.nombre.trim() || !producto.precioCompra.trim() || !producto.precioSinIva.trim() || !producto.cantidad.trim() || !producto.stock.trim()
        );
    
        if (!camposVacios) {
            const nuevoNumeroProducto = productos.length + 1;
            // Agrega un nuevo objeto producto a la lista de productos
            nuevosProductos.push({
                nombre: '',
                precioCompra: '',
                precioSinIva: '',
                cantidad: '',
                stock: ''
            });
    
            setProductos(nuevosProductos);
    
            if (!mostrarAgregarProductos) {
                setMostrarAgregarProductos(true);
            }
    
            setMostrarTotalVenta(true);
            setNumeroProducto(nuevoNumeroProducto);
            setMostrarTablaProductos(true);
    
            // Mostrar el botón GUARDAR al agregar el primer producto
            if (productos.length === 0) {
                setMostrarGuardarVenta(true);
            }
        } else {
            alert('Completa los campos vacíos antes de agregar otro producto vacío.');
        }
    };
    

    const handleVentaSubmit = async (e) => {
        e.preventDefault();

        let totalVentaCalculado = 0;
        const nuevosProductos = [];

        try {
            const db = getFirestore();
            const productsCollectionRef = collection(db, 'products');
            const ventasCollectionRef = collection(db, 'ventas');

            // Recorrer todos los productos ingresados para identificar los nuevos
            for (const producto of productos) {
                const { nombre, precioCompra, precioSinIva, cantidad, stock } = producto;

                // Verificar si el producto es nuevo
                if (!productosExistentes.find(p => p.name.toLowerCase() === nombre.toLowerCase())) {
                    const precioConIva = parseFloat(precioSinIva) * 1.19;
                    const precioRecomendado = precioConIva + 672;
                    const totalProducto = precioRecomendado * parseInt(cantidad);
                    totalVentaCalculado += totalProducto;
                    const nuevoMargenContribucion = ((precioSinIva - precioCompra) / precioCompra) * 100;
                    const nuevoMargenDescuento = (nuevoMargenContribucion * 25) / 100;
                    const nuevoMargenContMin = nuevoMargenContribucion - nuevoMargenDescuento;
                    const nuevoRecomendadoMin = precioCompra * (nuevoMargenContMin + 100) * 1.19;
            
                    const lowercaseName = nombre.toLowerCase();

                    // Agregar a la lista de nuevos productos a ser guardados en Firestore
                    nuevosProductos.push({
                        name: nombre,
                        name_lowercase: lowercaseName,
                        compra: parseFloat(precioCompra),
                        sinIva: parseFloat(precioSinIva),
                        conIva: precioConIva,
                        recomendado: precioRecomendado,
                        stock: parseInt(stock),
                        margenContribucion: parseFloat(nuevoMargenContribucion),
                        margenDescuento: parseFloat(nuevoMargenDescuento),
                        margenContMin: parseFloat(nuevoMargenContMin),
                        recomendadoMin: parseFloat(nuevoRecomendadoMin)

                    });

                    console.log('Producto nuevo agregado:', nombre);
                }
            }

            // Agregar cada nuevo producto a Firestore
            for (const nuevoProducto of nuevosProductos) {
                await addDoc(productsCollectionRef, nuevoProducto);
                console.log('Producto nuevo guardado en Firestore:', nuevoProducto.name);
            }

            // Crear un objeto para representar la venta
            const venta = {
                fecha: new Date(), // Puedes utilizar la fecha actual como timestamp de la venta
                totalVenta: totalVentaCalculado,
                productos: nuevosProductos, // Aquí podrías guardar solo los nuevos productos o todos los productos
            };

            // Guardar la información de la venta en la colección 'ventas'
            await addDoc(ventasCollectionRef, venta);

            // Actualizar el total de la venta
            setTotalVenta(totalVentaCalculado);

            // Mostrar mensaje de éxito y reiniciar el estado
            setMostrarAgregarProductos(false);
            setMostrarTablaProductos(true);
            setMostrarMensajeExito(true);
            setNumeroProducto(1); // Reiniciar el contador de número de producto
        } catch (error) {
            console.error('Error al agregar producto(s):', error);
        }
    };

    const handleInputChange = (index, e) => {
        const { name, value } = e.target;
        const newProductos = [...productos];
        newProductos[index] = { ...newProductos[index], [name]: value };

        // Recalculate total for the updated product
        const precioConIva = parseFloat(newProductos[index].precioSinIva) * 1.19;
        const precioRecomendado = precioConIva + 672;
        const totalProducto = precioRecomendado * parseInt(newProductos[index].cantidad);
        const nuevoMargenContribucion = ((newProductos[index].precioSinIva - newProductos[index].precioCompra) / newProductos[index].precioCompra) * 100;
        const nuevoMargenDescuento = (nuevoMargenContribucion * 25) / 100;
        const nuevoMargenContMin = nuevoMargenContribucion - nuevoMargenDescuento;
        const nuevoRecomendadoMin = newProductos[index].precioCompra * (nuevoMargenContMin + 100) * 1.19;

        newProductos[index] = {
            ...newProductos[index],
            [name]: value,
            totalProducto: totalProducto
        };

        setProductos(newProductos);

        // Recalculate total sale
        let totalVentaCalculado = 0;
        newProductos.forEach(producto => {
            if (!isNaN(producto.totalProducto)) {
                totalVentaCalculado += producto.totalProducto;
            }
        });

        setTotalVenta(totalVentaCalculado);
    };

    useEffect(() => {
        const fetchProductosExistentes = async () => {
            try {
                const db = getFirestore();
                const q = query(collection(db, 'products'), orderBy('name'));
                const querySnapshot = await getDocs(q);
                const productos = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setProductosExistentes(productos);
                setLoading(false);
            } catch (error) {
                console.error('Error al obtener productos existentes:', error);
                setLoading(false);
            }
        };

        fetchProductosExistentes();
    }, []);

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleAgregarProductoExistente = (productoExistente) => {
        // Verificar si hay algún producto nuevo con campos vacíos
        const camposVacios = productos.some(
            producto => !producto.nombre.trim() || 
                        !producto.precioCompra.trim() || 
                        !producto.precioSinIva.trim() || 
                        !producto.cantidad.trim() || 
                        !producto.stock.trim()
        );
    
        if (camposVacios) {
            alert('Completa los campos vacíos antes de agregar un producto existente.');
            return;
        }
    
        // Si todos los productos nuevos están completos, procede a agregar el producto existente
        setProductoSeleccionado(productoExistente);
        setProductos([
            ...productos,
            {
                nombre: productoExistente.name,
                precioCompra: productoExistente.compra.toString(),
                precioSinIva: productoExistente.sinIva.toString(),
                cantidad: '', // Puedes definir una cantidad inicial aquí
                stock: productoExistente.stock.toString()
            }
        ]);
    
        setMostrarListaProductos(true);
        setMostrarTablaProductos(true);
    };
    

    const handleGuardarVenta = async () => {
        try {
            const db = getFirestore();
            const ventasCollectionRef = collection(db, 'ventas');

            // Crear un objeto para representar la venta
            const venta = {
                fecha: new Date(), // Puedes utilizar la fecha actual como timestamp de la venta
                totalVenta: totalVenta,
                productos: productos, // Todos los productos agregados a la venta
            };

            // Guardar la información de la venta en la colección 'ventas'
            await addDoc(ventasCollectionRef, venta);

            // Mostrar mensaje de éxito y reiniciar el estado
            setMostrarAgregarProductos(false);
            setMostrarTablaProductos(true);
            setMostrarMensajeExito(true);
            setNumeroProducto(1); // Reiniciar el contador de número de producto

            // Emitir mensaje de "Venta finalizada"
            alert('Venta finalizada. Se ha registrado en el historial de ventas.');
        } catch (error) {
            console.error('Error al guardar la venta:', error);
            // Manejar errores aquí (mostrar un mensaje de error, etc.)
        } finally {
            // Ocultar el botón GUARDAR después de guardar la venta
            setMostrarGuardarVenta(false);
        }
    };

    const handleEliminarProducto = (index) => {
        const nuevosProductos = [...productos];
        nuevosProductos.splice(index, 1); // Eliminar el producto en el índice especificado
        setProductos(nuevosProductos);
    
        // Ocultar la tabla de productos si no hay productos restantes
        if (nuevosProductos.length === 0) {
            setMostrarTablaProductos(false);
        }
    
        // Re-calcular el total de la venta después de eliminar el producto
        let totalVentaCalculado = 0;
        nuevosProductos.forEach(producto => {
            if (!isNaN(producto.totalProducto)) {
                totalVentaCalculado += producto.totalProducto;
            }
        });
        setTotalVenta(totalVentaCalculado);
    };

    const handleCancelarSeleccion = () => {
        setProductoSeleccionado(null);
    
        // Eliminar el producto existente del detalle de la venta
        const nuevosProductos = productos.filter(producto => producto.nombre !== productoSeleccionado.name);
        setProductos(nuevosProductos);
    
        // Ocultar la tabla de productos si no hay productos restantes
        if (nuevosProductos.length === 0) {
            setMostrarTablaProductos(false);
        }
    };
    


    return (
        <div className="generar-venta-container">
            <h2>Generar Venta</h2>
            <form onSubmit={handleVentaSubmit}>
                {productos.map((producto, index) => (
                    <div key={index}>
                        <div className="form-row">
                            <p>Producto #{index + 1}</p>
                        </div>
                        <div className="form-row">
                            <label>Nombre del Producto:</label>
                            <input
                                type="text"
                                name="nombre"
                                value={producto.nombre}
                                onChange={(e) => handleInputChange(index, e)}
                                required
                            />
                        </div>
                        <div className="form-row">
                            <label>Precio de Compra:</label>
                            <input
                                type="number"
                                name="precioCompra"
                                value={producto.precioCompra}
                                onChange={(e) => handleInputChange(index, e)}
                                required
                            />
                        </div>
                        <div className="form-row">
                            <label>Precio sin IVA:</label>
                            <input
                                type="number"
                                name="precioSinIva"
                                value={producto.precioSinIva}
                                onChange={(e) => handleInputChange(index, e)}
                                required
                            />
                        </div>
                        <div className="form-row">
                            <label>Cantidad:</label>
                            <input
                                type="number"
                                name="cantidad"
                                value={producto.cantidad}
                                onChange={(e) => handleInputChange(index, e)}
                                required
                            />
                        </div>
                        <div className="form-row">
                            <label>Cantidad en Stock:</label>
                            <input
                                type="number"
                                name="stock"
                                value={producto.stock}
                                onChange={(e) => handleInputChange(index, e)}
                                required
                            />
                        </div>
                        {producto.totalProducto && (
                            <div>
                                <strong>Total $ {producto.totalProducto.toFixed(2)}</strong>
                            </div>
                        )}
                    </div>
                ))}
                <div className="form-row">
                    <button type="button" onClick={handleAgregarProducto}>
                        Añadir Producto Vacío
                    </button>
                    <button type="button" onClick={() => setMostrarListaProductos(true)}>
                        Añadir Producto Existente
                    </button>
                </div>
                {!productoSeleccionado && (
                    <div className="form-row">
                        <input
                            type="text"
                            placeholder="Buscar producto existente..."
                            value={searchTerm}
                            onChange={handleSearch}
                        />
                        <button type="button" onClick={() => setMostrarListaProductos(true)}>
                            Buscar
                        </button>
                    </div>
                )}

                {!productoSeleccionado && mostrarListaProductos && (
                    <div className="form-row">
                        <h3>Productos existentes:</h3>
                        <ul>
                            {productosExistentes
                                .filter(item =>
                                    item.name.toLowerCase().includes(searchTerm.toLowerCase())
                                )
                                .map(item => (
                                    <li key={item.id}>
                                        <button
                                            type="button"
                                            onClick={() => handleAgregarProductoExistente(item)}
                                        >
                                            {item.name}
                                        </button>
                                    </li>
                                ))}
                        </ul>
                    </div>
                )}

                {productoSeleccionado && (
                    <div className="form-row">
                        <p>Producto seleccionado: {productoSeleccionado.name}</p>
                        <button type="button" onClick={handleCancelarSeleccion}>
                            Cancelar selección
                        </button>
                    </div>
                )}

                {mostrarAgregarProductos && (
                    <div className="form-row">
                        <button type="submit">Agregar productos nuevos al sistema</button>
                    </div>
                )}
                {mostrarMensajeExito && (
                    <div className="form-row">
                        <p>Productos agregados con éxito.</p>
                    </div>
                )}
                {mostrarTablaProductos && (
                    <div className="form-row submitted-data">
                        <h3>Detalle de la Venta</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th>Precio Unitario</th>
                                    <th>Cantidad</th>
                                    <th>Total</th>
                                    <th>Eliminar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {productos.map((producto, index) => (
                                    <tr key={index}>
                                        <td>{producto.nombre}</td>
                                        <td>${parseFloat(producto.precioSinIva).toFixed(2)}</td>
                                        <td>{producto.cantidad}</td>
                                        <td>${parseFloat(producto.totalProducto).toFixed(2)}</td>
                                        <td>
                                            <button type="button" onClick={() => handleEliminarProducto(index)}>
                                                Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="form-row">
                            <strong>Total de la Venta: ${totalVenta.toFixed(2)}</strong>
                        </div>
                    </div>
                )}

                {mostrarTotalVenta && (
                    <div className="form-row">
                        <label>Total de la Venta:</label>
                        <span>{totalVenta.toFixed(2)}</span>
                    </div>
                )}
                {productos.length > 0 && (  // Mostrar el botón GUARDAR solo si hay productos agregados
                    <div className="form-row">
                        <button type="button" onClick={handleGuardarVenta}>
                            GUARDAR
                        </button>
                    </div>
                )}

            </form>
        </div>
    );
};

export default GenerarVenta;