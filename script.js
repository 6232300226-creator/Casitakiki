const _supabase = window.supabase.createClient(
'https://uhahtlotlhzaxsdgarqc.supabase.co',
'sb_publishable_fa8XDuQxlbIIqDgimkmvdg_LUDm1wGf'
);

let cart = [];
let total = 0;
let paypalRendered = false;

/* LOGIN GOOGLE */
async function loginWithGoogle() {
    console.log("¡Hiciste clic en el botón de Google!");
    
    try {
        const { data, error } = await _supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { 
                // Esto te regresa a la página donde estás
                redirectTo: window.location.origin 
            }
        });

        if (error) {
            console.error("Error al conectar con Supabase:", error.message);
            alert("No se pudo iniciar sesión: " + error.message);
        }
    } catch (err) {
        console.error("Error en el código:", err);
    }
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

// ==========================================
// LÓGICA DEL CARRITO (A PRUEBA DE ERRORES)
// ==========================================

function toggleCart() {
    const cartPanel = document.getElementById("shopping-cart");
    if(cartPanel) {
        cartPanel.classList.toggle("cart-hidden");
    } else {
        console.error("Falta el <aside id='shopping-cart'> en tu HTML");
    }
}

function agregarAlCarrito(nombre, precio) {
    const existente = cart.find(p => p.nombre === nombre);
    
    if (existente) {
        existente.cantidad += 1;
    } else {
        cart.push({ 
            nombre: nombre, 
            precio: Number(precio), 
            cantidad: 1 
        });
    }
    
    actualizarVistaCarrito();
    
    // Forzar a que se abra el carrito al agregar
    const cartPanel = document.getElementById("shopping-cart");
    if(cartPanel) {
        cartPanel.classList.remove("cart-hidden");
    }
}

function eliminarDelCarrito(index) {
    cart.splice(index, 1);
    actualizarVistaCarrito();
}

function actualizarVistaCarrito() {
    const items = document.getElementById("cart-items");
    const totalElement = document.getElementById("cart-total");
    const countElement = document.getElementById("cart-count");

    // Si falta el contenedor de items, detenemos la función para no romper la página
    if (!items || !totalElement) {
        console.error("Falta #cart-items o #cart-total en el HTML.");
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

            // Inyectamos los productos con estilos directos por si falla el CSS
            items.innerHTML += `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #ffe4ed; color: #854d5f; font-weight: bold;">
                <span>${item.nombre} (x${item.cantidad})</span>
                <span style="color: #ff6b9d;">$${subtotal.toFixed(2)}</span>
                <button onclick="eliminarDelCarrito(${index})" style="background: #ffc1d6; border: none; border-radius: 50%; width: 28px; height: 28px; cursor: pointer; color: white;">✖</button>
            </div>
            `;
        } );
    }

    totalElement.innerText = total.toFixed(2);
    
    // Solo actualiza el numerito del icono si el icono existe
    if (countElement) {
        countElement.innerText = cart.length;
    }
}
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
