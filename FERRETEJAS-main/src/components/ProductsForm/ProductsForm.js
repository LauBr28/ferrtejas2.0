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
  const [conIva, setConIva] = useState('');
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
  const conIvaValue = parseFloat(sinIva) * 1.19;
  // Calcular el precio recomendado de venta (precio con IVA + 672)
  const recomendadoValue = conIvaValue + 672;


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



  const handleProductRegistration = async (e) => {
    e.preventDefault();

    if (!name || !compra || !sinIva || !stock) {
      alert("Por favor complete todos los campos.");
      return;
    }

    try {
      // Convertir el nombre del nuevo producto a minúsculas
      const lowercaseName = name.toLowerCase();

      // Verificar si ya existe un producto con el mismo nombre (insensible a mayúsculas/minúsculas)
      const db = getFirestore();
      const productsCollectionRef = collection(db, "products");
      const querySnapshot = await getDocs(query(productsCollectionRef, where("name_lowercase", "==", lowercaseName)));
      const margenContribucionValue = (((parseFloat(sinIva) - parseFloat(compra)) / (parseFloat(compra)) * 100))
      const margenDescuentoValue = ((parseFloat(margenContribucionValue) * 25) / 100)
      const margenContMinValue = (parseFloat(margenContribucionValue) - parseFloat(margenDescuentoValue))
      const recomendadoMinValue = (parseFloat(compra) * (parseFloat(margenContMinValue) + 100) * 1.19)
  
      if (!querySnapshot.empty) {
        alert("Ya existe un producto con este nombre.");
        return;
      }

      const updateDateTime = new Date();
      // Si no hay un producto con el mismo nombre, proceder con el registro
      await addDoc(productsCollectionRef, {
        name: name,
        name_lowercase: lowercaseName, // Agregar una versión en minúsculas del nombre para realizar la búsqueda
        compra: compra,
        sinIva: sinIva,
        conIva: conIvaValue,
        recomendado: recomendadoValue,
        stock: stock,
        margenContribucion: margenContribucionValue, 
        margenDescuento: margenDescuentoValue,
        margenContMin: margenContMinValue, 
        recomendadoMin: recomendadoMinValue, 
        updateHistory: [{ dateTime: updateDateTime }]
      });
      console.log(app.firestore);
      console.log("Product added successfully!");

      setMargenContribucion(margenContribucionValue);
      setMargenDescuento(margenDescuentoValue);
      setMargenContMin(margenContMinValue);
      setRecomendadoMin(recomendadoMinValue);

      setName('');
      setCompra('');
      setSinIva('');
      setStock('');



      const updatedProducts = [...products, {
        name,
        compra,
        sinIva,
        conIva: conIvaValue,
        recomendado: recomendadoValue,
        stock,
        margenContribucion: margenContribucionValue,
        margenDescuento: margenDescuentoValue,
        margenContMin: margenContMinValue,
        recomendadoMin: recomendadoMinValue
      }];
      setProducts(updatedProducts);
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
      const db = getFirestore();
      const productDocRef = doc(db, "products", selectedProductId);
      // Obtener el documento actual
      const docSnapshot = await getDoc(productDocRef);
      const productData = docSnapshot.data();

      const margenContribucionValue = (((parseFloat(sinIva) - parseFloat(compra)) / (parseFloat(compra)) * 100))
      const margenDescuentoValue = ((parseFloat(margenContribucionValue) * 25) / 100)
      const margenContMinValue = (parseFloat(margenContribucionValue) - parseFloat(margenDescuentoValue))
      const recomendadoMinValue = (parseFloat(compra) * (parseFloat(margenContMinValue) + 100) * 1.19)

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
        margenContribucion: margenContribucionValue, // Nuevo campo
        margenDescuento: margenDescuentoValue, // Nuevo campo
        margenContMin: margenContMinValue, // Nuevo campo
        recomendadoMin: recomendadoMinValue, // Nuevo campo
        updateHistory: updatedHistory
      });
      console.log("Product updated successfully!");
      setMargenContribucion(margenContribucionValue);
      setMargenDescuento(margenDescuentoValue);
      setMargenContMin(margenContMinValue);
      setRecomendadoMin(recomendadoMinValue);
      // Actualizar la lista de productos después de la edición
      const updatedProducts = products.map(product => {
        if (product.id === selectedProductId) {
          return {
            ...product,
            name: name,
            compra: compra,
            sinIva: sinIva,
            conIva: conIvaValue, // Actualiza conIva con el nuevo valor
            recomendado: recomendadoValue, // Actualiza recomendado con el nuevo valor
            stock: stock,
            margenContribucion: margenContribucionValue, // Nuevo campo
            margenDescuento: margenDescuentoValue, // Nuevo campo
            margenContMin: margenContMinValue, // Nuevo campo
            recomendadoMin: recomendadoMinValue, 

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
            <input type="number" placeholder="Precio de compra" value={compra} onChange={(e) => setCompra(e.target.value)} />
            <input type="number" placeholder="Precio sin IVA" value={sinIva} onChange={(e) => setSinIva(e.target.value)} />
            <input type="number" placeholder="Cantidad del producto" value={stock} onChange={(e) => setStock(e.target.value)} />
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
                <td>${product.compra}</td>
                <td>${product.sinIva}</td>
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