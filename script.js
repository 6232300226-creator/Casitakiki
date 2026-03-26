// =============================================
// CONFIGURACIÓN DE SUPABASE (solo una vez)
// =============================================
const _supabase = window.supabase.createClient(
    'https://uhahtlotlhzaxsdgarqc.supabase.co',
    'sb_publishable_fa8XDuQxlbIIqDgimkmvdg_LUDm1wGf'
);

// =============================================
// LOGIN CON GOOGLE
// =============================================
async function loginWithGoogle() {
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
}

const btnLogin = document.getElementById('btn-login-google');
if (btnLogin) {
    btnLogin.addEventListener('click', loginWithGoogle);
}

// =============================================
// VERIFICAR SESIÓN AL CARGAR
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
    const nombre = user.user_metadata.full_name || user.email;
    btn.textContent = `👋 ${nombre}`;
    btn.onclick = async () => {
        await _supabase.auth.signOut();
        btn.textContent = '🔐 Iniciar con Google';
        btn.onclick = loginWithGoogle;
    };
}

// Detecta cuando regresa del redirect de Google
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
// CARGAR PRODUCTOS DESDE SUPABASE
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

    console.log("Productos recibidos:", productos);

    const contenedor = document.querySelector('.grid-productos');
    if (!contenedor) return;

    contenedor.innerHTML = '';

    if (productos.length === 0) {
        contenedor.innerHTML = '<p style="text-align:center; color:#aaa;">No hay productos disponibles 🌸</p>';
        return;
    }

    productos.forEach(prod => {
        contenedor.innerHTML += `
            <article class="card">
                <img src="${prod.imagen_url}" alt="${prod.nombre}">
                <h3 style="padding: 0 15px; color: #854d5f;">${prod.nombre}</h3>
                <p class="precio" style="padding: 0 15px;">$${Number(prod.precio).toFixed(2)}</p>
                <div style="padding: 0 15px 15px;">
                    <button class="btn-comprar" onclick="agregarAlCarrito('${prod.nombre}', ${prod.precio})">
                        Añadir al carrito 🛒
                    </button>
                </div>
            </article>
        `;
    });
}

// =============================================
// CARRITO DE COMPRAS
// =============================================
function toggleCart() {
    const cartPanel = document.getElementById('shopping-cart');
    cartPanel.classList.toggle('cart-hidden');
}

function agregarAlCarrito(nombre, precio) {
    cart.push({ nombre, precio: Number(precio) });
    total += Number(precio);
    actualizarVistaCarrito();

    const cartPanel = document.getElementById('shopping-cart');
    cartPanel.classList.remove('cart-hidden');
}

function eliminarDelCarrito(index) {
    total -= cart[index].precio;
    if (total < 0) total = 0;
    cart.splice(index, 1);
    actualizarVistaCarrito();
}

function actualizarVistaCarrito() {
    const itemsContainer = document.getElementById('cart-items');
    const totalElement = document.getElementById('cart-total');
    const countElement = document.getElementById('cart-count');

    itemsContainer.innerHTML = '';

    if (cart.length === 0) {
        itemsContainer.innerHTML = '<p class="empty-msg">Tu carrito está vacío 🌸</p>';
        total = 0;
    } else {
        cart.forEach((item, index) => {
            itemsContainer.innerHTML += `
                <div class="cart-item">
                    <span>${item.nombre} - $${Number(item.precio).toFixed(2)}</span>
                    <button class="delete-btn" onclick="eliminarDelCarrito(${index})">🗑️</button>
                </div>
            `;
        });
    }

    totalElement.innerText = total.toFixed(2);
    countElement.innerText = cart.length;
}

// =============================================
// PAGO CON PAYPAL
// =============================================
function irAPagar() {
    if (cart.length === 0) {
        alert("¡Tu carrito está vacío!");
        return;
    }

    const btnCompra = document.getElementById('finalizar-compra');
    const paypalContainer = document.getElementById('paypal-button-container');

    if (btnCompra) btnCompra.style.display = 'none';
    if (paypalContainer) paypalContainer.style.display = 'block';

    console.log("Preparando pago por un total de: $" + total.toFixed(2));
}

async function registrarVenta(montoTotal) {
    const { data, error } = await _supabase
        .from('ventas')
        .insert([
            { total: montoTotal, metodo_pago: 'PayPal' }
        ]);

    if (error) {
        console.error('Error al guardar la venta:', error);
        alert("Error al guardar la venta ❌");
    } else {
        alert("¡Venta guardada! 🎂💖");
    }
}

// =============================================
// INICIAR AL CARGAR LA PÁGINA
// =============================================
document.addEventListener('DOMContentLoaded', cargarProductos);
