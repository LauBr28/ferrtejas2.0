import React, { useState, useEffect } from 'react';
import { getFirestore, collection, addDoc, query, getDocs, orderBy } from 'firebase/firestore';
import './GenerarVenta.css'; // Importa el archivo de estilos
import { updateDoc, doc } from 'firebase/firestore';

const GenerarVenta = () => {
    
    const [productos, setProductos] = useState([]); // Estado para almacenar productos
    const [totalVenta, setTotalVenta] = useState(0); // Estado para el total de la venta
    const [stock, setStock] = useState('');
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
    const [selectedProductHistory, setSelectedProductHistory] = useState([]);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [nuevoMargenContribucion1, setNuevoMargenContribucion1] = useState(0);
    let precioRecomendado;
    const updateDateTime = new Date();

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
                stock: '',
                recomendado: 0,
                margenContMin: 0,
                margenContribucion: 0,
                nuevoMargenContribucion1: 0,
                totalProducto: 0,
                venta: [{ dateTime: updateDateTime }]
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
    
            for (const producto of productos) {
                const { nombre, precioCompra, precioSinIva, cantidad, stock } = producto;
    
                if (!productosExistentes.find(p => p.name.toLowerCase() === nombre.toLowerCase())) {
                    const precioConIva = parseFloat(precioSinIva) * 1.19;
                    const nuevoMargenContribucion = (((parseFloat(precioSinIva) - parseFloat(precioCompra)) / parseFloat(precioSinIva)) * 100);
                    const nuevoMargenDescuento = (nuevoMargenContribucion * 0.25);
                    const nuevoMargenContMin = nuevoMargenContribucion - nuevoMargenDescuento;
                    const nuevoRecomendadoMin = parseFloat((precioCompra * (1 + nuevoMargenContMin / 100) * 1.19) + 747);
                    const precioRecomendado = nuevoMargenContribucion < 0 ? ((parseFloat(precioCompra) * 1.3) + 747) * 1.19 : (parseFloat(precioSinIva) + 747) * 1.19;
                    const totalProducto = precioRecomendado * parseInt(cantidad);
                    totalVentaCalculado += totalProducto;
                    const nuevoMargenContribucion2 = ((((parseFloat(precioRecomendado) / 1.19) - parseFloat(precioCompra)) / parseFloat(precioRecomendado) / 1.19) * 100);
                    const updateDateTime = new Date();
                    const lowercaseName = nombre.toLowerCase();
    
                    nuevosProductos.push({
                        name: nombre,
                        name_lowercase: lowercaseName,
                        compra: parseFloat(precioCompra),
                        sinIva: parseFloat(precioSinIva),
                        conIva: precioConIva,
                        recomendado: parseFloat(precioRecomendado),
                        stock: parseInt(stock),
                        margenContribucion: parseFloat(nuevoMargenContribucion2),
                        margenDescuento: parseFloat(nuevoMargenDescuento),
                        margenContMin: parseFloat(nuevoMargenContMin),
                        recomendadoMin: parseFloat(nuevoRecomendadoMin),
                        dateTime: updateDateTime
                    });
    
                    console.log('Producto nuevo agregado:', nombre);
                } else {
                    const productoExistente = productosExistentes.find(p => p.name.toLowerCase() === nombre.toLowerCase());
                    const stockActualizado = productoExistente.stock - parseInt(cantidad);
    
                    await updateDoc(doc(db, 'products', productoExistente.id), {
                        stock: stockActualizado
                    });
    
                    nuevosProductos.push({
                        ...productoExistente,
                        cantidadVendida: parseInt(cantidad),
                        stock: parseFloat(stockActualizado)
                    });
    
                    totalVentaCalculado += (parseFloat(productoExistente.recomendado) * parseInt(cantidad));
                }
            }
    
            setTotalVenta(totalVentaCalculado);
    
            // Agrupar las consultas de actualización de stock en una sola operación
            const updateStockPromises = nuevosProductos
                .filter(producto => producto.cantidadVendida)
                .map(async producto => {
                    await updateDoc(doc(db, 'products', producto.id), {
                        stock: producto.stock - producto.cantidadVendida
                    });
                    console.log(`Stock actualizado para ${producto.name}: ${producto.stock - producto.cantidadVendida}`);
                });
    
            // Esperar a que todas las actualizaciones de stock se completen antes de continuar
            await Promise.all(updateStockPromises);
    
            // Agregar cada nuevo producto a Firestore
            const addProductsPromises = nuevosProductos
                .filter(producto => !producto.id)
                .map(async nuevoProducto => {
                    await addDoc(productsCollectionRef, nuevoProducto);
                    console.log('Producto nuevo guardado en Firestore:', nuevoProducto.name);
                });
    
            // Esperar a que se completen todas las operaciones de agregar productos
            await Promise.all(addProductsPromises);
    
            const venta = {
                fecha: new Date(),
                totalVenta: totalVentaCalculado,
                productos: nuevosProductos,
            };
    
            await addDoc(ventasCollectionRef, venta);
    
            setMostrarAgregarProductos(false);
            setMostrarTablaProductos(true);
            setMostrarMensajeExito(true);
            setNumeroProducto(1);
        } catch (error) {
            console.error('Error al agregar producto(s):', error);
            // Manejar errores aquí (mostrar un mensaje de error, etc.)
        }
    };
    

    const handleInputChange = (index, e) => {
        const { name, value } = e.target;
        const newProductos = [...productos];
        newProductos[index] = { ...newProductos[index], [name]: value };
    
        // Recalculate total for the updated product
        const precioCompra = parseFloat(newProductos[index].precioCompra) || 0;
        const precioSinIva = parseFloat(newProductos[index].precioSinIva) || 0;
        const cantidad = parseFloat(newProductos[index].cantidad) || 0;
        const precioConIva = precioSinIva * 1.19;
        const nuevoMargenContribucion = ((precioSinIva - precioCompra) / precioCompra) * 100;
        const nuevoMargenDescuento = (nuevoMargenContribucion * 25) / 100;
        const nuevoMargenContMin = nuevoMargenContribucion - nuevoMargenDescuento;
        const nuevoRecomendadoMin = precioCompra * (nuevoMargenContMin + 100) * 1.19;
    
        if (parseFloat(nuevoMargenContribucion) < 0) {
            precioRecomendado = ((precioCompra * 1.3) + 747) * 1.19;
        } else {
            precioRecomendado = (precioSinIva + 747) * 1.19;
        }
    
        const totalProducto = precioRecomendado * cantidad;
    
        newProductos[index] = {
            ...newProductos[index],
            [name]: value,
            totalProducto: totalProducto,
            recomendado: precioRecomendado,
            margenContMin: nuevoMargenContMin,
            margenContribucion: nuevoMargenContribucion,
            venta: [{ dateTime: updateDateTime }]
        };
        setProductos(newProductos);
    
        let totalVentaCalculado = 0;
        newProductos.forEach(producto => {
            if (!isNaN(producto.totalProducto)) {
                totalVentaCalculado += producto.totalProducto;
            }
        });
    
        setTotalVenta(totalVentaCalculado);
    };
    
const handleNuevoMargenContribucionChange = (index, e) => {
    const { value } = e.target;
    const updatedProductos = [...productos];
    const nuevoMargenContribucion2 = parseFloat(value);
    const margenContMin = parseFloat(updatedProductos[index].margenContMin);
    const margenContribucion = parseFloat(updatedProductos[index].margenContribucion);

    // Verificar que el nuevo margen esté entre margenContMin y margenContribucion, incluyendo los decimales
    if (nuevoMargenContribucion2 >= margenContMin && nuevoMargenContribucion2 <= margenContribucion) {
        updatedProductos[index].nuevoMargenContribucion1 = nuevoMargenContribucion2;

        // Calcular el nuevo precio total
        const precioCompra = parseFloat(updatedProductos[index].precioCompra);
        const cantidad = parseFloat(updatedProductos[index].cantidad);
        const nuevoPrecioTotal = (precioCompra * (1 + nuevoMargenContribucion2 / 100) * 1.19) + 747;
        updatedProductos[index].totalProducto = nuevoPrecioTotal * cantidad;

        setProductos(updatedProductos);
    } else {
        // Opcional: manejar el caso en que el margen ingresado no esté en el rango permitido
        console.error(`El margen de contribución debe estar entre ${margenContMin.toFixed(2)} y ${margenContribucion.toFixed(2)}.`);
    }
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

    const handleAgregarProductoExistente = async (productoExistente) => {
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
        setProductos([
            ...productos,
            {
                nombre: productoExistente.name,
                precioCompra: productoExistente.compra.toString(),
                precioSinIva: productoExistente.sinIva.toString(),
                recomendado: productoExistente.recomendado, // se añade la corrección para que se imprima el recomendado
                margenContMin: productoExistente.margenContMin,
                margenContribucion: productoExistente.margenContribucion,
                cantidad: '', // Puedes definir una cantidad inicial aquí
                stock: productoExistente.stock.toString(),
                venta: [{ dateTime: updateDateTime }]
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
    
            // Construir un array de promesas para actualizar el stock de cada producto vendido
            const updateStockPromises = productos.map(async (producto) => {
                if (producto.id) { // Verificar si el producto es existente
                    const stockActualizado = producto.stock - producto.cantidad;
                    // Retornar la promesa de actualización del stock
                    return updateDoc(doc(db, 'products', producto.id), {
                        stock: stockActualizado
                    });
                }
            });
    
            // Ejecutar todas las promesas de actualización en paralelo
            await Promise.all(updateStockPromises);
    
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
                                            onClick={() => handleAgregarProductoExistente(item)}>
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
                                    <th>Intervalo margen</th>
                                    <th>Seleccionar margen</th>
                                    <th>Cantidad</th>
                                    <th>Total</th>
                                    <th>Historial</th>
                                    <th>Eliminar</th>
                                </tr>
                            </thead>
                            <tbody>
                            {productos.map((producto, index) => (
                            <tr key={index}>
                                <td>{producto.nombre}</td>
                                <td>${parseFloat(producto.recomendado).toFixed(2)}</td>
                                <td>{parseFloat(producto.margenContMin).toFixed(2)} a {parseFloat(producto.margenContribucion).toFixed(2)}</td>
                                <td>
                                    <input
                                        type="number"
                                        value={producto.nuevoMargenContribucion1} // Asigna el valor del estado del producto aquí
                                        onChange={(e) => handleNuevoMargenContribucionChange(index, e)} // Maneja el cambio en el valor del input
                                    />
                                </td>
                                <td>{producto.cantidad}</td>
                                <td>${parseFloat(producto.totalProducto).toFixed(2)}</td>
                                <td>{producto.venta && producto.venta[0] && producto.venta[0].dateTime ? 
                                        new Date(producto.venta[0].dateTime).toLocaleString('es-ES'): "No disponible"}
                                </td>
                                <td>
                                    <button type="button" onClick={() => handleEliminarProducto(index)}>
                                        Eliminar
                                    </button>
                                </td>
                            </tr>
                        ))}
                            </tbody>
                        </table>
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