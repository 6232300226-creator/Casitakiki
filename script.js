const _supabase = window.supabase.createClient(
    'https://uhahtlotlhzaxsdgarqc.supabase.co',
    'sb_publishable_fa8XDuQxlbIIqDgimkmvdg_LUDm1wGf'
);

let cart = [];
let total = 0;
let paypalRendered = false;

// Variables de filtros
let todosLosProductos = [];
let categoriaActiva = 0;
let precioMax = 500;

/* =========================================
   LOGIN GOOGLE
========================================= */
async function loginWithGoogle() {
    const { data, error } = await _supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: 'https://6232300226-creator.github.io/Casitakiki/' }
    });
    if (error) alert("No se pudo iniciar sesión: " + error.message);
}

async function cerrarSesion() {
    await _supabase.auth.signOut();
    location.reload();
}

async function guardarUsuarioEnDB(user) {
    const { error } = await _supabase.from('usuarios').upsert([
        {
            id: user.id,
            nombre: user.user_metadata?.full_name || '',
            email: user.email,
            avatar: user.user_metadata?.avatar_url || ''
        }
    ], { onConflict: 'id' });

    if (error) console.error("Error al guardar usuario:", error.message);
}

function actualizarBotonLogin(user) {
    const btn = document.getElementById("btn-login-google");
    if (!btn) return;

    if (user) {
        const nombre = user.user_metadata?.full_name || user.email;
        const avatar = user.user_metadata?.avatar_url;

        btn.outerHTML = `
            <div id="user-info" style="display:flex; align-items:center; gap:10px;">
                ${avatar ? `<img src="${avatar}" style="width:32px; height:32px; border-radius:50%; border:2px solid #ff9dbf;">` : ''}
                <span style="color:#854d5f; font-weight:bold; font-size:0.9rem;">
                    Hola, ${nombre.split(' ')[0]} 
                </span>
                <button onclick="cerrarSesion()"
                    style="background:#ffc1d6; border:none; padding:6px 14px; border-radius:20px;
                           cursor:pointer; font-weight:bold; color:#854d5f;
                           font-family:'Quicksand',sans-serif; transition:0.3s;">
                    Salir
                </button>
            </div>
        `;
    }
}

/* =========================================
   CARGAR PRODUCTOS
========================================= */
async function cargarProductos() {
    // CORRECCIÓN: Asegurarse de usar _supabase (el cliente), no supabase
    const { data, error } = await _supabase.from('productos').select('*');
    
    if (error) {
        console.error("Error al cargar productos:", error);
        return;
    }
    todosLosProductos = data;
    aplicarFiltros();
}

/* =========================================
   FILTROS
========================================= */
function filtrarCategoria(catId, btn) {
    categoriaActiva = catId;
    document.querySelectorAll('.chip-cat').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    aplicarFiltros();
}

function actualizarPrecio(val) {
    precioMax = Number(val);
    document.getElementById('precio-label').textContent = '$' + val;
    aplicarFiltros();
}

function aplicarFiltros() {
    const busqueda = document.getElementById('buscador').value.toLowerCase();
    const orden = document.getElementById('ordenar').value;

    let resultado = todosLosProductos.filter(p => {
        const matchCat = categoriaActiva === 0 || p.categoria_id === categoriaActiva;
        const matchPrecio = p.precio <= precioMax;
        const matchBusqueda = p.nombre.toLowerCase().includes(busqueda);
        return matchCat && matchPrecio && matchBusqueda;
    });

    if (orden === 'precio-asc') resultado.sort((a, b) => a.precio - b.precio);
    else if (orden === 'precio-desc') resultado.sort((a, b) => b.precio - a.precio);
    else if (orden === 'nombre') resultado.sort((a, b) => a.nombre.localeCompare(b.nombre));

    renderizarProductos(resultado);
}

function renderizarProductos(lista) {
    const grid = document.querySelector('.grid-productos');
    if (!grid) return;

    if (lista.length === 0) {
        grid.innerHTML = '<p style="text-align:center; color:#a0848d; padding:2rem;">No se encontraron productos 🌸</p>';
        return;
    }

    grid.innerHTML = lista.map(p => `
        <article class="card">
            <img src="${p.imagen_url}" alt="${p.nombre}">
            <h3>${p.nombre}</h3>
            <p class="precio">$${Number(p.precio).toFixed(2)}</p>
            <button class="btn-comprar" onclick="agregarAlCarrito('${p.nombre}', ${p.precio})">
                Añadir al carrito
            </button>
        </article>
    `).join('');
}

/* =========================================
   LÓGICA DEL CARRITO
========================================= */
function toggleCart() {
    const cartPanel = document.getElementById("shopping-cart");
    if (cartPanel) cartPanel.classList.toggle("cart-hidden");
}

function agregarAlCarrito(nombre, precio) {
    const existente = cart.find(p => p.nombre === nombre);
    if (existente) {
        existente.cantidad += 1;
    } else {
        cart.push({ nombre, precio: Number(precio), cantidad: 1 });
    }
    actualizarVistaCarrito();
    const cartPanel = document.getElementById("shopping-cart");
    if (cartPanel) cartPanel.classList.remove("cart-hidden");
}

function eliminarDelCarrito(index) {
    cart.splice(index, 1);
    actualizarVistaCarrito();
}

function actualizarVistaCarrito() {
    const items = document.getElementById("cart-items");
    const totalElement = document.getElementById("cart-total");
    const countElement = document.getElementById("cart-count");
    if (!items || !totalElement) return;

    items.innerHTML = "";
    total = 0;

    if (cart.length === 0) {
        items.innerHTML = '<p class="empty-msg" style="text-align:center; color:#a0848d;">Tu carrito está vacío 🌸</p>';
    } else {
        cart.forEach((item, index) => {
            const subtotal = item.precio * item.cantidad;
            total += subtotal;
            items.innerHTML += `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid #ffe4ed; color:#854d5f; font-weight:bold;">
                <span>${item.nombre} (x${item.cantidad})</span>
                <span style="color:#ff6b9d;">$${subtotal.toFixed(2)}</span>
                <button onclick="eliminarDelCarrito(${index})" style="background:#ffc1d6; border:none; border-radius:50%; width:28px; height:28px; cursor:pointer; color:white;">✖</button>
            </div>`;
        });
    }

    totalElement.innerText = total.toFixed(2);
    if (countElement) countElement.innerText = cart.length;
}

/* =========================================
   PAGOS (PAYPAL) Y VENTAS
========================================= */
function irAPagar() {
    if (cart.length === 0) { alert("Tu carrito está vacío"); return; }
    document.getElementById("finalizar-compra").style.display = "none";
    document.getElementById("paypal-button-container").style.display = "block";
    if (!paypalRendered) { renderPaypal(); paypalRendered = true; }
}

function renderPaypal() {
    paypal.Buttons({
        createOrder: (data, actions) => actions.order.create({
            purchase_units: [{ amount: { value: total.toFixed(2) } }]
        }),
        onApprove: (data, actions) => actions.order.capture().then(details => {
            alert("Pago completado por " + details.payer.name.given_name);
            registrarVenta(total);
            cart = []; total = 0; paypalRendered = false;
            actualizarVistaCarrito();
            document.getElementById("paypal-button-container").innerHTML = "";
            document.getElementById("paypal-button-container").style.display = "none";
            document.getElementById("finalizar-compra").style.display = "block";
            document.getElementById("shopping-cart")?.classList.add("cart-hidden");
        })
    }).render('#paypal-button-container');
}

async function registrarVenta(totalVenta) {
    try {
        await _supabase.from('ventas').insert([{ total: totalVenta, metodo_pago: 'PayPal' }]);
    } catch (error) {
        console.error("Error al guardar en Supabase:", error);
    }
}

/* =========================================
   INICIALIZAR
========================================= */
document.addEventListener("DOMContentLoaded", async () => {
    cargarProductos();

    const { data: { session } } = await _supabase.auth.getSession();
    if (session?.user) {
        actualizarBotonLogin(session.user);
        guardarUsuarioEnDB(session.user);
    } else {
        const btn = document.getElementById("btn-login-google");
        if (btn) btn.addEventListener("click", loginWithGoogle);
    }

    _supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
            actualizarBotonLogin(session.user);
            guardarUsuarioEnDB(session.user);
        }
    });
});
