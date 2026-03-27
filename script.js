const _supabase = window.supabase.createClient(
    'https://uhahtlotlhzaxsdgarqc.supabase.co',
    'sb_publishable_fa8XDuQxlbIIqDgimkmvdg_LUDm1wGf'
);

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

let cart = [];
let total = 0;

async function cargarProductos() {
    console.log("Cargando productos desde Supabase...");
    const result = await _supabase.from('productos').select('*');

    if (result.error) {
        console.error('Error al cargar productos:', result.error);
        return;
    }

    var productos = result.data;
    console.log("Productos recibidos:", productos);

    var contenedor = document.querySelector('.grid-productos');
    if (!contenedor) return;

    contenedor.innerHTML = '';

    if (productos.length === 0) {
        contenedor.innerHTML = '<p style="text-align:center; color:#aaa;">No hay productos disponibles</p>';
        return;
    }

    productos.forEach(function(prod) {
        contenedor.innerHTML += '<article class="card">' +
            '<img src="' + prod.imagen_url + '" alt="' + prod.nombre + '">' +
            '<h3 style="padding: 0 15px; color: #854d5f;">' + prod.nombre + '</h3>' +
            '<p class="precio" style="padding: 0 15px;">$' + Number(prod.precio).toFixed(2) + '</p>' +
            '<div style="padding: 0 15px 15px;">' +
            '<button class="btn-comprar" onclick="agregarAlCarrito(\'' + prod.nombre + '\', ' + prod.precio + ')">Añadir al carrito</button>' +
            '</div></article>';
    });
}

function toggleCart() {
    var cartPanel = document.getElementById('shopping-cart');
    cartPanel.classList.toggle('cart-hidden');
}

function agregarAlCarrito(nombre, precio) {
    cart.push({ nombre: nombre, precio: Number(precio) });
    total += Number(precio);
    actualizarVistaCarrito();
    var cartPanel = document.getElementById('shopping-cart');
    cartPanel.classList.remove('cart-hidden');
}

function eliminarDelCarrito(index) {
    total -= cart[index].precio;
    if (total < 0) total = 0;
    cart.splice(index, 1);
    actualizarVistaCarrito();

    // Si se vacía el carrito mientras PayPal está visible, regresa al botón normal
    if (cart.length === 0) {
        var paypalContainer = document.getElementById('paypal-button-container');
        var btnCompra = document.getElementById('finalizar-compra');
        if (paypalContainer) {
            paypalContainer.style.display = 'none';
            paypalContainer.innerHTML = '';
        }
        if (btnCompra) btnCompra.style.display = 'block';
    }
}

function actualizarVistaCarrito() {
    var itemsContainer = document.getElementById('cart-items');
    var totalElement = document.getElementById('cart-total');
    var countElement = document.getElementById('cart-count');

    itemsContainer.innerHTML = '';

    if (cart.length === 0) {
        itemsContainer.innerHTML = '<p class="empty-msg">Tu carrito esta vacio</p>';
        total = 0;
    } else {
        cart.forEach(function(item, index) {
            itemsContainer.innerHTML += '<div class="cart-item">' +
                '<span>' + item.nombre + ' - $' + Number(item.precio).toFixed(2) + '</span>' +
                '<button class="delete-btn" onclick="eliminarDelCarrito(' + index + ')">🗑️</button>' +
                '</div>';
        });
    }

    totalElement.innerText = total.toFixed(2);
    countElement.innerText = cart.length;
}

function irAPagar() {
    if (cart.length === 0) {
        alert("Tu carrito esta vacio!");
        return;
    }

    var btnCompra = document.getElementById('finalizar-compra');
    var paypalContainer = document.getElementById('paypal-button-container');

    if (btnCompra) btnCompra.style.display = 'none';
    if (paypalContainer) {
        paypalContainer.style.display = 'block';
        paypalContainer.innerHTML = ''; // limpia botones anteriores
    }

    // Calcula el total actual del carrito
    var totalPago = cart.reduce(function(sum, item) {
        return sum + item.precio;
    }, 0);

    paypal.Buttons({

        createOrder: function(data, actions) {
            return actions.order.create({
                purchase_units: [{
                    description: "Compra en La Casita de Kiki",
                    amount: {
                        currency_code: "MXN",
                        value: totalPago.toFixed(2),
                        breakdown: {
                            item_total: {
                                currency_code: "MXN",
                                value: totalPago.toFixed(2)
                            }
                        }
                    },
                    items: cart.map(function(item) {
                        return {
                            name: item.nombre,
                            quantity: "1",
                            unit_amount: {
                                currency_code: "MXN",
                                value: Number(item.precio).toFixed(2)
                            }
                        };
                    })
                }]
            });
        },

        onApprove: function(data, actions) {
            return actions.order.capture().then(function(detalles) {
                // Muestra mensaje de éxito dentro del carrito
                paypalContainer.innerHTML =
                    '<div style="background:#e6f4ea; color:#2e7d32; padding:14px; border-radius:6px; text-align:center; font-family:sans-serif;">' +
                    '✅ ¡Pago completado!<br>' +
                    'Gracias, <strong>' + detalles.payer.name.given_name + '</strong> 🌸<br>' +
                    '<small>ID: ' + detalles.id + '</small>' +
                    '</div>';

                // Registra la venta en Supabase
                registrarVenta(totalPago);

                // Vacía el carrito
                cart = [];
                total = 0;
                actualizarVistaCarrito();
            });
        },

        onCancel: function() {
            // Regresa al botón original si cancela
            paypalContainer.style.display = 'none';
            paypalContainer.innerHTML = '';
            if (btnCompra) btnCompra.style.display = 'block';
        },

        onError: function(err) {
            alert("Ocurrió un error con PayPal. Intenta de nuevo.");
            console.error(err);
            paypalContainer.style.display = 'none';
            paypalContainer.innerHTML = '';
            if (btnCompra) btnCompra.style.display = 'block';
        }

    }).render('#paypal-button-container');
}

async function registrarVenta(montoTotal) {
    const result = await _supabase.from('ventas').insert([{ total: montoTotal, metodo_pago: 'PayPal' }]);
    if (result.error) {
        console.error("Error al guardar la venta:", result.error);
    } else {
        console.log("Venta registrada en Supabase ✅");
    }
}

document.addEventListener('DOMContentLoaded', cargarProductos);
