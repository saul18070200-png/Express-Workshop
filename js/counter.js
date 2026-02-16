import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, onSnapshot, updateDoc, setDoc, increment } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import firebaseConfig from "./firebase-config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const counterElement = document.getElementById('visit-count-header');
const VISIT_KEY = 'novax_last_visit_timestamp';
const SESSION_TIMEOUT = 1000 * 60 * 30; // 30 minutos entre visitas contadas

// Función para animar el conteo
const animateValue = (obj, start, end, duration) => {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start).toLocaleString();
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
};

// Referencia al documento de contador
// Usaremos la colección "counters" y el documento "landing_stats"
const counterRef = doc(db, "counters", "landing_stats");

// 1. ESCUCHAR CAMBIOS EN TIEMPO REAL
// Esto actualiza el número automáticamente en todas las pantallas abiertas
onSnapshot(counterRef, (docSnap) => {
    if (docSnap.exists()) {
        const data = docSnap.data();
        const currentVal = parseInt(counterElement.innerText.replace(/,/g, '')) || 0;
        // Animar desde el valor actual al nuevo (2.5 segundos para efecto dramático)
        animateValue(counterElement, currentVal, data.count, 2500);
    } else {
        // Si es la primera vez y no existe, lo creamos
        console.log("Creando contador inicial...");
        setDoc(counterRef, { count: 3100 });
    }
}, (error) => {
    console.error("Error conectando a Firestore:", error);
    // Indicador visual discreto de error de conexión (probablemente falta config)
    counterElement.style.opacity = "0.5";
});

// 2. INCREMENTAR VISITAS
const registerVisit = async () => {
    try {
        const lastVisit = localStorage.getItem(VISIT_KEY);
        const now = Date.now();

        // Solo contamos si no hay registro previo o si pasaron 30 mins
        if (!lastVisit || (now - parseInt(lastVisit) > SESSION_TIMEOUT)) {
            await updateDoc(counterRef, {
                count: increment(1)
            });
            localStorage.setItem(VISIT_KEY, now.toString());
            console.log("Visita registrada +1");
        } else {
            console.log("Visita recurrente (no incrementa)");
        }
    } catch (error) {
        // Si falla (ej. documento no existe), el setDoc en onSnapshot lo arreglará
        // o si falta permisos/config, se mostrará el error en consola
        console.warn("No se pudo incrementar visita:", error);
    }
};

// Iniciar registro
registerVisit();
