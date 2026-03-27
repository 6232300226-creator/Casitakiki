const _supabase = window.supabase.createClient(
'https://uhahtlotlhzaxsdgarqc.supabase.co',
'sb_publishable_fa8XDuQxlbIIqDgimkmvdg_LUDm1wGf'
);

// carrito
let cart = [];
let total = 0;

async function loginWithGoogle() {
    const { error } = await _supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.href }
    });
    if (error) {
        console.error('Error:', error.message);
        alert('Error al iniciar sesion con Google');
    }
}

function actualizarBotonUsuario(user) {
    const btn = document.getElementById('btn-login-google');
    if (!btn) return;

    const nombre = user.user_metadata.full_name || user.email;
    btn.textContent = '👋 ' + nombre;

    btn.onclick = async function() {
        await _supabase.auth.signOut();
        btn.textContent = '🔐 Iniciar con Google';
        btn.onclick = loginWithGoogle;
    };
}

async function verificarSesion() {
    const result = await _supabase.auth.getSession();
    if (result.data.session) {
        actualizarBotonUsuario(result.data.session.user);
    }
}

_supabase.auth.onAuthStateChange(function(event, session) {
    if (session) {
        actualizarBotonUsuario(session.user);
    }
});

var btnLogin = document.getElementById('btn-login-google');
if (btnLogin) {
    btnLogin.addEventListener('click', loginWithGoogle);
}

verificarSesion();

async function cargarProductos() {
    const result = await _supabase.from('productos').select('*');

    if (result.error) {
        console.error('Error al cargar productos:', result.error);
        return;
    }

    var productos = result.data;
    var contenedor = document.querySelector('.grid-productos');

    if (!contenedor) return;

    contenedor.innerHTML = '';

    productos.forEach(function(prod) {
        contenedor.innerHTML += `
            <article class="card">
                <img src="${prod.imagen_url}">
                <h3>${prod.nombre}</h3>
                <p class="precio">$${Number(prod.precio).toFixed(2)}</p>
                <button class="btn-comprar"
                    onclick="agregarAlCarrito('${prod.nombre}', ${prod.precio})">
                    Añadir al carrito
                </button>
            </article>
        `;
    });
}

function toggleCart() {
    document.getElementById('shopping-cart')
        .classList.toggle('cart-hidden');
}

function agregarAlCarrito(nombre, precio) {
    cart.push({ nombre, precio: Number(precio) });
    total += Number(precio);
    actualizarVistaCarrito();

    document.getElementById('shopping-cart')
        .classList.remove('cart-hidden');
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
        itemsContainer.innerHTML =
            '<p class="empty-msg">Tu carrito está vacío</p>';
        total = 0;
    } else {
        cart.forEach((item, index) => {
            itemsContainer.innerHTML += `
                <div class="cart-item">
                    <span>${item.nombre} - $${item.precio.toFixed(2)}</span>
                    <button class="delete-btn"
                        onclick="eliminarDelCarrito(${index})">
                        🗑️
                    </button>
                </div>
            `;
        });
    }

    totalElement.innerText = total.toFixed(2);
    countElement.innerText = cart.length;
}

/* BOTON FINALIZAR COMPRA */
function irAPagar() {

    if (cart.length === 0) {
        alert("Tu carrito está vacío");
        return;
    }

    document.getElementById("finalizar-compra").style.display = "none";
    document.getElementById("paypal-button-container").style.display = "block";

    renderPaypal();
}

/* RENDER PAYPAL */
function renderPaypal() {

    paypal.Buttons({

        createOrder: function(data, actions) {
            return actions.order.create({
                purchase_units: [{
                    amount: {
                        value: total.toFixed(2)
                    }
                }]
            });
        },

        onApprove: function(data, actions) {
            return actions.order.capture().then(function(details) {

                alert("Pago completado por " + details.payer.name.given_name);

                registrarVenta(total);

                cart = [];
                total = 0;
                actualizarVistaCarrito();

                document.getElementById("paypal-button-container").innerHTML = "";
                document.getElementById("paypal-button-container").style.display = "none";
                document.getElementById("finalizar-compra").style.display = "block";

            });
        },

        onError: function(err) {
            console.error(err);
            alert("Error con PayPal");
        }

    }).render("#paypal-button-container");
}

async function registrarVenta(montoTotal) {
    await _supabase.from('ventas').insert([
        { total: montoTotal, metodo_pago: 'PayPal' }
    ]);
}

document.addEventListener('DOMContentLoaded', cargarProductos);
