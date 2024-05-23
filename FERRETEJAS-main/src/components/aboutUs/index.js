import React from 'react';

const AboutUs = () => {
  return (
    <div className='flex flex-col items-center justify-center h-screen' style={{backgroundColor: '#e1e3ff'}}>
      <div className='w-10/12 md:w-8/12 lg:w-7/12 bg-white p-6 rounded shadow-md mt-12'>
        <h1 className='text-3xl font-bold mb-4'>Sobre Nosotros</h1>
        <p className='text-lg mb-4'>
          ¡Bienvenidos a Ferretejas App! Como equipo de tres 
          desarrolladoras dedicadas, nos unimos para crear 
          esta aplicación integral diseñada para satisfacer todas las 
          necesidades de esta ferretería. Nuestra aplicación, tiene como objetivo 
          simplificar la gestión de inventario, ventas e interacciones 
          con los clientes. Hemos utilizado las últimas tecnologías para 
          asegurar que Ferretejas App sea no solo robusta y confiable, sino 
          también intuitiva y fácil de usar. Ya sea que estés rastreando niveles 
          de stock o gestionando ventas, nuestra 
          aplicación te proporciona todas las herramientas necesarias para 
          operar tu negocio de manera fluida. Gracias por elegirnos como desarrolladoras.
        </p>
        <h2 className='text-2xl font-semibold mb-2'>¡Contáctanos si deseas mas información de nosotras!</h2>
        <ul className='list-disc list-inside'>
          <li>sofiaranguren21@gmail.com</li>
          <li>alejabr2812@gmail.com</li>
          <li>jessicar2004g@gmail.com</li>
        </ul>
      </div>
    </div>
  );
}

export default AboutUs;
