const _supabase = window.supabase.createClient(
'https://uhahtlotlhzaxsdgarqc.supabase.co',
'sb_publishable_fa8XDuQxlbIIqDgimkmvdg_LUDm1wGf'
);

let cart = [];
let total = 0;
let paypalRendered = false;

/* LOGIN GOOGLE */
async function loginWithGoogle() {
    const { error } = await _supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.href }
    });
}

/* CARGAR PRODUCTOS */
async function cargarProductos() {
    const { data, error } = await _supabase.from('productos').select('*');
    if (error) return;

    const contenedor = document.querySelector('.grid-productos');
    contenedor.innerHTML = '';

    data.forEach(prod => {
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

/* ABRIR / CERRAR CARRITO */
function toggleCart() {
    const cartPanel = document.getElementById("shopping-cart");
    cartPanel.classList.toggle("cart-hidden");
}

/* AGREGAR PRODUCTO */
function agregarAlCarrito(nombre, precio) {

    const existente = cart.find(p => p.nombre === nombre);

    if (existente) {
        existente.cantidad += 1;
    } else {
        cart.push({
            nombre,
            precio: Number(precio),
            cantidad: 1
        });
    }

    actualizarVistaCarrito();
    document.getElementById("shopping-cart").classList.remove("cart-hidden");
}

/* ELIMINAR */
function eliminarDelCarrito(index) {
    cart.splice(index, 1);
    actualizarVistaCarrito();
}

/* ACTUALIZAR UI */
/* ACTUALIZAR UI */
function actualizarVistaCarrito() {
    const items = document.getElementById("cart-items");
    const totalElement = document.getElementById("cart-total");
    const countElement = document.getElementById("cart-count");

    // Escudo: Si falta algún elemento en el HTML, avisa en consola pero no congela la página
    if (!items || !totalElement || !countElement) {
        console.error("Falta un elemento del carrito en el HTML");
        return; 
    }

    items.innerHTML = "";
    total = 0;

    if (cart.length === 0) {
        items.innerHTML = '<p class="empty-msg" style="text-align: center; color: #a0848d;">Tu carrito está vacío 🌸</p>';
    } else {
        cart.forEach((item, index) => {
            const subtotal = item.precio * item.cantidad;
            total += subtotal;

            items.innerHTML += `
            <div class="cart-item">
                <span>${item.nombre} (x${item.cantidad})</span>
                <span>$${subtotal.toFixed(2)}</span>
                <button onclick="eliminarDelCarrito(${index})">❌</button>
            </div>
            `;
        });
    }

    totalElement.innerText = total.toFixed(2);
    countElement.innerText = cart.length;
}
/* BOTON PAGAR */
function irAPagar() {

    if (cart.length === 0) {
        alert("Tu carrito está vacío");
        return;
    }

    document.getElementById("finalizar-compra").style.display = "none";
    document.getElementById("paypal-button-container").style.display = "block";

    if (!paypalRendered) {
        renderPaypal();
        paypalRendered = true;
    }
}

/* PAYPAL */
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
        paypalRendered = false;

        actualizarVistaCarrito();

        document.getElementById("paypal-button-container").innerHTML = "";
        document.getElementById("paypal-button-container").style.display = "none";
        document.getElementById("finalizar-compra").style.display = "block";

        // 👇 CERRAR CARRITO
        document.getElementById("shopping-cart")
            .classList.add("cart-hidden");
    });
}

    }).render('#paypal-button-container');
}

/* GUARDAR VENTA */
async function registrarVenta(total) {
    await _supabase.from('ventas').insert([
        { total: total, metodo_pago: 'PayPal' }
    ]);
}

document.addEventListener("DOMContentLoaded", cargarProductos);
