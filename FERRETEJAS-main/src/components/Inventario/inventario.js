import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import './inventario.css';

const Inventario = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            const q = query(collection(db, 'products'), orderBy('name'));
            const querySnapshot = await getDocs(q);
            const documents = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setData(documents);
            setLoading(false);
        };
        fetchData();
    }, []);

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const formatCurrency = (value) => {
        // Convertir el valor a número y dividirlo para agregar un punto decimal
        const intValue = parseInt(value);
        const decimalPart = value % 100; // Obtener los últimos dos dígitos
        const integerPart = (value - decimalPart) / 100; // Obtener la parte entera

        return `$${integerPart.toLocaleString()}.${decimalPart.toLocaleString().padStart(2, '0')}`;
    };

    const filteredData = data.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className='container'>
            <h1>Inventario de Productos</h1>
            <input
                type="text"
                placeholder="Buscar producto..."
                value={searchTerm}
                onChange={handleSearch}
            />
            <table>
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Precio de compra</th>
                        <th>Precio venta sin IVA</th>
                        <th>Precio venta con IVA</th>
                        <th>Precio sugerido de venta</th> 
                        <th>Cantidad</th>
                        <th>Margen de contribución</th>
                        <th>Margen de descuento</th>
                        <th>Margen Cont.Mínimo</th>
                        <th>Precio sugerido de venta mínimo</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredData.map(item => (
                        <tr key={item.id}>
                            <td>{item.name}</td>
                            <td>${item.compra}</td>
                            <td>${item.sinIva}</td>
                            <td>${parseFloat(item.conIva).toFixed(0)}</td>
                            <td>${parseFloat(item.recomendado).toFixed(0)}</td>
                            <td>{item.stock}</td>
                            <td>{parseFloat(item.margenContribucion).toFixed(2)}</td>
                            <td>{parseFloat(item.margenDescuento).toFixed(2)}</td>
                            <td>{parseFloat(item.margenContMin).toFixed(2)}</td>
                            <td>{formatCurrency(parseFloat(item.recomendadoMin).toFixed(0))}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default Inventario;
