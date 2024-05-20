import React, { useState, useEffect } from 'react';
import { getFirestore, collection, addDoc, getDocs } from "firebase/firestore";
import 'firebase/database';
import 'firebase/auth';
import './Cotizacion.css';

const Cotizacion = () => {
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [price, setPrice] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);

  useEffect(() => {
    const fetchProducts = async () => {
      const db = getFirestore();
      const productsCollectionRef = collection(db, "products");
      const querySnapshot = await getDocs(productsCollectionRef);
      const productsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(productsData);
    };
    fetchProducts();
  }, []);

  const handleAddProduct = () => {
    const newProduct = {
      name: productName,
      quantity: quantity,
      price: price,
      totalPrice: price * quantity
    };

    setSelectedProducts([...selectedProducts, newProduct]);
    setTotalPrice(totalPrice + newProduct.totalPrice);

    // Reset input fields
    setProductName('');
    setQuantity(0);
    setPrice(0);
  };

  const handleQuotationSubmission = async (e) => {
    e.preventDefault();

    if (selectedProducts.length === 0) {
      alert("Por favor seleccione al menos un producto.");
      return;
    }

    try {
      const db = getFirestore();
      const quotationsCollectionRef = collection(db, "quotations");

      await addDoc(quotationsCollectionRef, {
        products: selectedProducts,
        totalPrice,
        date: new Date()
      });

      setSelectedProducts([]);
      setTotalPrice(0);
      alert("Venta guardada correctamente");
    } catch (error) {
      console.error("Error agregando la venta: ", error);
    }
  };

  return (
    <div className="quotation-form-container">
      <>
        <form className="quotation-form" onSubmit={handleQuotationSubmission}>
          <h2>Ingresar Producto</h2>
          <div className="product-inputs">
            <input
              type="text"
              placeholder="Nombre del Producto"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
            />
            <input
              type="number"
              min="0"
              placeholder="Cantidad"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
            />
            <input
              type="number"
              min="0"
              placeholder="Precio"
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value))}
            />
            <button type="button" onClick={handleAddProduct}>
              Agregar Producto
            </button>
          </div>

          <h2>Productos Seleccionados</h2>
          {selectedProducts.map((product, index) => (
            <div key={index} className="product-selection">
              <span>{product.name} ({product.quantity} x ${product.price}) - Total: ${product.totalPrice.toFixed(2)}</span>
            </div>
          ))}

          <h3>Total: ${totalPrice.toFixed(2)}</h3>

          <button type="submit">Guardar venta</button>
        </form>
      </>
    </div>
  );
};

export default Cotizacion;
