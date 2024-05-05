import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDCU81nSaFDOlaahOoaB8agcUmvz79-SNo",
    authDomain: "ferretejas-311c2.firebaseapp.com",
    databaseURL: "https://ferretejas-311c2-default-rtdb.firebaseio.com",
    projectId: "ferretejas-311c2",
    storageBucket: "ferretejas-311c2.appspot.com",
    messagingSenderId: "135743521413",
    appId: "1:135743521413:web:4d2ea3a1ec308d08539fec"
  };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export {db,app, auth};
