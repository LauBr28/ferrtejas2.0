import React, { useState, useEffect } from 'react';
import { getFirestore, collection, addDoc, getDocs,getDoc, deleteDoc, doc, updateDoc, query, where, serverTimestamp, arrayUnion, FieldValue } from "firebase/firestore";
import './ProductsForm.css';
import { useAuth } from '../../contexts/authContext';
import { app } from '../../firebase/firebase';
import 'firebase/database';
import 'firebase/auth';

const ProductsForm = () => {
  const { isAdmin } = useAuth();
  const [name, setName] = useState('');
  const [compra, setCompra] = useState('');
  const [sinIva, setSinIva] = useState('');
  let [conIva, setConIva] = useState('');
  const [recomendado, setRecomendado] = useState('');
  const [stock, setStock] = useState('');
  const [margenContribucion, setMargenContribucion] = useState('');
  const [margenDescuento, setMargenDescuento] = useState('');
  const [margenContMin, setMargenContMin] = useState('');
  const [recomendadoMin, setRecomendadoMin] = useState('');
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [selectedProductHistory, setSelectedProductHistory] = useState([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Calcular el precio con IVA
  conIva = parseFloat(sinIva) * 1.19;
  let recomendadoValue;


  useEffect(() => {
    const fetchData = async () => {
      const db = getFirestore();
      const productsCollectionRef = collection(db, "products");
      const querySnapshot = await getDocs(productsCollectionRef);
      const productsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(productsData);
    };
    fetchData();
  }, []);
// Función para formatear el precio
const formatPrice = (price) => {
  // Convertir el precio a un número con dos decimales y formato de miles y coma
  return parseFloat(price).toLocaleString('es-ES', {
      minimumFractionDigits: 2
  });
};


const handleProductRegistration = async (e) => {
  e.preventDefault();

  if (!name || !compra || !sinIva || !stock) {
    alert("Por favor complete todos los campos.");
    return;
  }

  try {
    const lowercaseName = name.toLowerCase();

    const db = getFirestore();
    const productsCollectionRef = collection(db, "products");
    const querySnapshot = await getDocs(query(productsCollectionRef, where("name_lowercase", "==", lowercaseName)));

    if (!querySnapshot.empty) {
      alert("Ya existe un producto con este nombre.");
      return;
    }

    const margenContribucionValue = (((parseFloat(sinIva) - parseFloat(compra)) / parseFloat(sinIva)) * 100);
    const margenDescuentoValue = ((parseFloat(margenContribucionValue) * 25) / 100);
    const margenContMinValue = (parseFloat(margenContribucionValue) - parseFloat(margenDescuentoValue));
    const recomendadoMinValue = parseFloat((compra * (1 + (margenContMinValue / 100)) * 1.19));
    
    let recomendadoValue;
    if (parseFloat(margenContribucionValue) < 0) {
        recomendadoValue = ((parseFloat(compra) * 1.3) + 747) * 1.19;
    } else {
        recomendadoValue = (parseFloat(conIva) + 747) * 1.19;
    }

    const margenContribucionValue2 = ((((parseFloat(recomendadoValue) / 1.19) - parseFloat(compra)) / (parseFloat(recomendadoValue) / 1.19)) * 100);

    const updateDateTime = new Date();

    const docRef = await addDoc(productsCollectionRef, {
      name: name,
      name_lowercase: lowercaseName,
      compra: compra,
      sinIva: sinIva,
      conIva: conIva,
      recomendado: recomendadoValue,
      stock: stock,
      margenContribucion: margenContribucionValue2, 
      margenDescuento: margenDescuentoValue,
      margenContMin: margenContMinValue, 
      recomendadoMin: recomendadoMinValue, 
      updateHistory: [{ dateTime: updateDateTime }]
    });

    console.log("Product added successfully!");

    setRecomendado(recomendadoValue);
    setMargenContribucion(margenContribucionValue2);
    setMargenDescuento(margenDescuentoValue);
    setMargenContMin(margenContMinValue);
    setRecomendadoMin(recomendadoMinValue);

    setName('');
    setCompra('');
    setSinIva('');
    setStock('');

    const updatedProducts = [...products, {
      id: docRef.id, // Añadir el ID del nuevo producto
      name,
      compra,
      sinIva,
      conIva,
      recomendado: recomendadoValue,
      stock,
      margenContribucion: margenContribucionValue2,
      margenDescuento: margenDescuentoValue,
      margenContMin: margenContMinValue,
      recomendadoMin: recomendadoMinValue
    }];
    setProducts(updatedProducts);
    setSelectedProductId(docRef.id); // Establecer el ID del nuevo producto como seleccionado
  } catch (error) {
    console.error("Error adding product: ", error);
  }
};


  const handleProductDeletion = async (productName) => {
    try {
      const db = getFirestore();
      const q = query(collection(db, "products"), where("name", "==", productName));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach(async (doc) => {
        await deleteDoc(doc.ref);
      });
      console.log("Product deleted successfully!");
      const updatedProducts = products.filter(product => product.name !== productName);
      setProducts(updatedProducts);
    } catch (error) {
      console.error("Error deleting product: ", error);
    }
  };
  const handleProductEdit = async () => {
    if (!selectedProductId) {
      alert("No se ha seleccionado ningún producto para editar.");
      return;
    }
  
    try {
      const margenContribucionValue = (((parseFloat(sinIva) - parseFloat(compra)) / (parseFloat(compra)) * 100))
      const margenDescuentoValue = ((parseFloat(margenContribucionValue) * 25) / 100)
      const margenContMinValue = (parseFloat(margenContribucionValue) - parseFloat(margenDescuentoValue))
      const recomendadoMinValue = parseFloat((compra * (1 + margenContMin / 100) * 1.19));
      if (parseFloat(margenContribucionValue) < 0) {
        // Si el margen de contribución es menor que 0, multiplica la compra por 1.13 y suma 747
        recomendadoValue = ((parseFloat(compra) * 1.3) + 747) * 1.19;
    } else {
        // De lo contrario, suma 747 a la compra
        recomendadoValue = (parseFloat(conIva) + 747) * 1.19;
    }
    const margenContribucionValue2 = ((((parseFloat(recomendadoValue) / 1.19) - parseFloat(compra)) / (parseFloat(recomendadoValue) / 1.19)) * 100);
  
      // Actualizar los estados de los campos de entrada primero
      setName(name);
      setCompra(compra);
      setSinIva(sinIva);
      setConIva(conIva);
      setRecomendado(recomendadoValue);
      setStock(stock);
  
      const db = getFirestore();
      const productDocRef = doc(db, "products", selectedProductId);
      // Obtener el documento actual
      const docSnapshot = await getDoc(productDocRef);
      const productData = docSnapshot.data();
  
      // Actualizar el historial de actualizaciones
      const updatedHistory = productData.updateHistory || [];
      updatedHistory.push({ dateTime: new Date() });
  
      await updateDoc(productDocRef, {
        name: name,
        compra: compra,
        sinIva: sinIva,
        conIva: conIva,
        recomendado: recomendado,
        stock: stock,
        margenContribucion: margenContribucionValue2,
        margenDescuento: margenDescuentoValue,
        margenContMin: margenContMinValue,
        recomendadoMin: recomendadoMinValue,
        updateHistory: updatedHistory
      });
  
      console.log("Product updated successfully!");
  
      // Actualizar la lista de productos después de la edición
      const updatedProducts = products.map(product => {
        if (product.id === selectedProductId) {
          return {
            ...product,
            name: name,
            compra: compra,
            sinIva: sinIva,
            conIva: conIva,
            recomendado: recomendadoValue,
            stock: stock,
            margenContribucion: margenContribucionValue2,
            margenDescuento: margenDescuentoValue,
            margenContMin: margenContMinValue,
            recomendadoMin: recomendadoMinValue
          };
        }
        return product;
      });
      setProducts(updatedProducts);
  
      // Limpiar los campos de entrada después de la edición
      setName('');
      setCompra('');
      setSinIva('');
      setStock('');
      setSelectedProductId(null);
    } catch (error) {
      console.error("Error updating product: ", error);
    }
  };


  const handleProductClick = (product) => {
    setName(product.name);
    setCompra(product.compra);
    setSinIva(product.sinIva);
    setConIva(product.conIva);
    setRecomendado(product.recomendado);
    setStock(product.stock);
    setSelectedProductId(product.id);
  };

  const handleShowHistoryModal = (product) => {
    console.log(product);
    setSelectedProductHistory(product.updateHistory);
    setIsHistoryModalOpen(true);
    console.log(isHistoryModalOpen);
  };

  const handleCloseHistoryModal = () => {
    setIsHistoryModalOpen(false);
  };

  return (
    <div className="form-container">
      {isAdmin && (
        <>
          <h1>Registrar un nuevo producto</h1>
          <form className="form" onSubmit={handleProductRegistration}>
            <input type="text" placeholder="Nombre del producto" value={name} onChange={(e) => setName(e.target.value)} />
            <input type="number" placeholder="Precio de compra" value={compra} onChange={(e) => setCompra(parseFloat(e.target.value))} />
            <input type="number" placeholder="Precio sin IVA" value={sinIva} onChange={(e) => {
              const newValue = parseFloat(e.target.value);
              setSinIva(newValue);
              const conIvaValue = parseFloat(newValue) * 1.19;
              setConIva(conIvaValue);
               }} />
            <input type="number" placeholder="Cantidad del producto" value={stock} onChange={(e) => setStock(parseFloat(e.target.value))} />
            <button type="submit">Registrar</button>
            <button type="button" onClick={handleProductEdit}>Actualizar</button>
          </form>
        </>
      )}
      <div>
        <h1>Productos en la base de datos</h1>
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Precio de compra</th>
              <th>Precio sin IVA</th>
              <th>Cantidad</th>
              {isAdmin && <th>Acciones</th>}
              <th>Historial</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>${formatPrice(product.compra)}</td>
                <td>${formatPrice(product.sinIva)}</td>
                <td>{product.stock}</td>
                {isAdmin && (
                  <td className="action-buttons">
                    <button onClick={() => handleProductDeletion(product.name)}>Eliminar </button>
                    <button onClick={() => handleProductClick(product)}> Editar</button>
                  </td>
                )}
                <td>
                  <button onClick={() => handleShowHistoryModal(product)}>Ver Historial</button>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Modal para mostrar el historial */}
      {isHistoryModalOpen && (
        <div className="modal" style={{ display: isHistoryModalOpen ? 'block' : 'none' }}>
          <div className="modal-content">
            <span className="close-btn" onClick={handleCloseHistoryModal}>&times;</span>
            <h2>Historial de actualización del producto</h2>
            {selectedProductHistory ? (
              selectedProductHistory.length > 0 ? (
                <ul>
                  {selectedProductHistory.map((history, index) => (
                     <li key={index}>{new Date(history.dateTime.seconds * 1000).toLocaleString()}</li>
                  ))}
                </ul>
              ) : (
                <p>Aún no hay historial para este producto.</p>
              )
            ) : (
              <p>Aún no hay historial para este producto.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default ProductsForm;