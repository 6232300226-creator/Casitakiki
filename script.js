// =============================================
// CONFIGURACIÓN DE SUPABASE
// =============================================
const _supabase = window.supabase.createClient(
    'https://uhahtlotlhzaxsdgarqc.supabase.co',
    'AQUI_VA_TU_ANON_KEY_REAL' // ⚠️ cambia esto
);

// =============================================
// LOGIN CON GOOGLE
// =============================================
window.loginWithGoogle = async function () {
    const { error } = await _supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.href
        }
    });

    if (error) {
        console.error('Error al iniciar sesión:', error.message);
        alert('Error al iniciar sesión con Google ❌');
    }
};

// =============================================
// BOTÓN (usa ID en HTML)
// =============================================
const btnLogin = document.getElementById('btn-login-google');
if (btnLogin) {
    btnLogin.addEventListener('click', window.loginWithGoogle);
}

// =============================================
// VERIFICAR SESIÓN
// =============================================
async function verificarSesion() {
    const { data: { session } } = await _supabase.auth.getSession();
    if (session) {
        actualizarBotonUsuario(session.user);
    }
}

function actualizarBotonUsuario(user) {
    const btn = document.getElementById('btn-login-google');
    if (!btn) return;

    const nombre = user.user_metadata?.full_name || user.email;

    btn.textContent = `👋 ${nombre}`;
    btn.onclick = async () => {
        await _supabase.auth.signOut();
        btn.textContent = '🔐 Iniciar con Google';
        btn.onclick = window.loginWithGoogle;
    };
}

// Detecta login después de Google
_supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
        actualizarBotonUsuario(session.user);
    }
});

verificarSesion();

// =============================================
// VARIABLES DEL CARRITO
// =============================================
let cart = [];
let total = 0;

// =============================================
// CARGAR PRODUCTOS
// =============================================
async function cargarProductos() {
    console.log("Cargando productos desde Supabase...");

    const { data: productos, error } = await _supabase
        .from('productos')
        .select('*');

    if (error) {
        console.error('Error al cargar productos:', error);
        return;
    }

    const contenedor = document.querySelector('.grid-productos');
    if (!contenedor) return;

    contenedor.innerHTML = '';

    if (productos.length === 0) {
        contenedor.innerHTML = '<p>No hay productos disponibles 🌸</p>';
        return;
    }

    productos.forEach(prod => {
        contenedor.innerHTML += `
            <article class="card">
                <img src="${prod.imagen_url}" alt="${prod.nombre}">
                <h3>${prod.nombre}</h3>
                <p>$${Number(prod.precio).toFixed(2)}</p>
                <button onclick="agregarAlCarrito('${prod.nombre}', ${prod.precio})">
                    Añadir 🛒
                </button>
            </article>
        `;
    });
}

// =============================================
// CARRITO
// =============================================
function toggleCart() {
    document.getElementById('shopping-cart').classList.toggle('cart-hidden');
}

function agregarAlCarrito(nombre, precio) {
    cart.push({ nombre, precio: Number(precio) });
    total += Number(precio);
    actualizarVistaCarrito();
}

function eliminarDelCarrito(index) {
    total -= cart[index].precio;
    cart.splice(index, 1);
    actualizarVistaCarrito();
}

function actualizarVistaCarrito() {
    const itemsContainer = document.getElementById('cart-items');
    const totalElement = document.getElementById('cart-total');
    const countElement = document.getElementById('cart-count');

    itemsContainer.innerHTML = '';

    if (cart.length === 0) {
        itemsContainer.innerHTML = '<p>Tu carrito está vacío 🌸</p>';
        total = 0;
    } else {
        cart.forEach((item, index) => {
            itemsContainer.innerHTML += `
                <div>
                    ${item.nombre} - $${item.precio}
                    <button onclick="eliminarDelCarrito(${index})">❌</button>
                </div>
            `;
        });
    }

    totalElement.innerText = total.toFixed(2);
    countElement.innerText = cart.length;
}

// =============================================
// INICIAR
// =============================================
document.addEventListener('DOMContentLoaded', cargarProductos);

// =============================================
// FINALIZAR COMPRA
// =============================================
window.irAPagar = function() {
    if (cart.length === 0) {
        alert("Tu carrito está vacío. ¡Agrega unas cositas lindas primero! 🌸");
        return;
    }
    
    console.log("Iniciando proceso de pago...");
    alert(`¡Listo para procesar tu pago por $${total.toFixed(2)}! Aquí puedes conectar PayPal luego 💳`);
};
