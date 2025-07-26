// ✅ Load all products from backend and show in UI
async function loadProducts() {
    try {
        const response = await fetch('http://127.0.0.1:8000/products');
        if (!response.ok) {
            console.error('Failed to load products');
            return;
        }

        const products = await response.json();
        const productsList = document.getElementById('product-list');
        productsList.innerHTML = ''; // Clear previous

        products.forEach(product => {
            const div = document.createElement('div');
            div.className = 'product-item';
            div.innerHTML = `
                <div class="flex flex-col bg-white rounded-lg p-2 w-full shadow-md hover:bg-gray-200 border-1 border-gray-100 transition-shadow duration-100">
                    <div class="flex">
                        
                        <div class="flex flex-col ">
                            <div class="text-xs font-medium w-32 overflow-hidden text-ellipsis whitespace-nowrap">${product.name}</div>
                            <div class="text-xs font-light text-gray-500">Rs.${product.price.toFixed(2)}</div>
                        </div>
                    </div>
                </div>
            `;
            div.addEventListener('click', () => addToCart(product));
            productsList.appendChild(div);
        });

    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// ✅ Load products on window load
window.onload = () => {
    loadProducts();
}

// ✅ Cart logic
let cart = [];

function addToCart(product) {
    let found = false;

    for (let item of cart) {
        if (item.id === product.id) {
            item.quantity += 1;
            found = true;
            break;
        }
    }

    if (!found) {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1
        });
    }

    updateCartUI();
    scrollToTop() 
}

function updateCartUI() {
    const cartList = document.getElementById('cart');
    cartList.innerHTML = ''; // Clear existing items
    let total = 0;

    cart.forEach(item => {
        total += item.price * item.quantity;

        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div class="flex flex-col gap-0.5 m-2">
                <div class="flex items-center justify-between">
                <div class="font-medium text-sm w-48 overflow-hidden text-ellipsis whitespace-nowrap">${item.name}</div>
                <button class="text-gray-300 hover:text-gray-600  text-xs bg-gray-200 rounded-md w-4 h-4 transition-colors duration-50"
                 onclick="removeFromCart(${item.id})">X</button>
                </div>
                <div class="flex items-center justify-between">
                    <div class="font-light text-gray-600 text-xs">Rs.${item.price.toFixed(2)} x
                    <input type="number" min="1" value="${item.quantity}"
                    style="width: 30px;" onchange="changeQuantity(${item.id}, this.value)">
                    </div>
                    
                    <div class=" text-gray-800 text-sm">Rs.${(item.price * item.quantity).toFixed(2)}</div>
                </div>
            </div>
        `;
        cartList.appendChild(div);
        
    });

    const totalDiv = document.getElementById('total');
    totalDiv.innerHTML = `Total: Rs.${total.toFixed(2)}`;


    document.getElementById('enterAmount').addEventListener('input', () => {
        const inputAmount = parseFloat(document.getElementById('enterAmount').value) || 0; // Get input value or default to 0
        const balanceInput = document.getElementById('sub-total');

        if (isNaN(inputAmount)) {
            balanceInput.innerHTML = 'Balance: Rs.0.00';
            return;
        }
        if (inputAmount < total) {
            balanceInput.innerHTML = `Balance: Rs.0.00`;
        } else {
            balanceInput.innerHTML = `Balance: Rs.${(inputAmount - total).toFixed(2)}`;
        }
    });


   


}

function changeQuantity(itemID, newQuantity){
    newQuantity = parseInt(newQuantity);
    if(isNaN(newQuantity) || newQuantity <= 0) {
        alert('Please enter a valid quantity.');
        return;
    }

    const item = cart.find(item => item.id === itemID);
    if (item) {
        item.quantity = newQuantity;
        updateCartUI();
    }
}


function removeFromCart(deleteID){
    cart = cart.filter(item => item.id !== deleteID);

    updateCartUI();

}

// ✅ Add product (used on product entry page)
async function addProduct() {
    const productName = document.getElementById('product-name').value;
    const productPrice = parseFloat(document.getElementById('product-price').value);

    if (!productName || isNaN(productPrice) || productPrice <= 0) {
        alert('Please enter valid product details.');
        return;
    }

    try {
        const res = await fetch('http://127.0.0.1:8000/products', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: productName,
                price: productPrice,
            }),
        });

        const data = await res.json();
        alert(`Product added: ${data.name} - Rs.${data.price.toFixed(2)}`);
        loadProducts(); // Refresh product list
    } catch (error) {
        console.error('Error adding product:', error);
    }
}

function scrollToTop() {
    const cart = document.getElementById('cart');
    cart.scrollTop =cart.scrollHeight; // Scroll to the bottom of the cart
}

async function checkOut() {
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const paidAmount = parseFloat(document.getElementById('enterAmount').value) || 0;
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || "Cash";

    if (paidAmount < total) {
        alert('Insufficient amount paid. Please enter a valid amount.');
        return;
    }
    if (cart.length === 0) {
        alert('Your cart is empty. Please add items to the cart before checking out.');
        return;
    }
    

    const balance = paidAmount - total;

    const items = cart.map(item => ({
        product_name: item.name,
        quantity:item.quantity,
        price:item.price
    }));

    const data = {
        items,
        total: total.toFixed(2),
        paid : paidAmount.toFixed(2),
        balance: balance.toFixed(2),
        payment_method: paymentMethod
    };

    try{
        const response = await fetch('http://127.0.0.1:8000/checkout',{
            method:"POST",
            headers:{
                "Content-Type":"application/json"
            },
            body:JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const result = await response.json();
        alert(`Checkout successful! Receipt ID: ${result.id}`);
        console.log('message', result.message);

        // Restart cart after checkout
        cart = [];
        updateCartUI();
        document.getElementById('enterAmount').value = '';
        document.getElementById('sub-total').innerHTML = 'Balance: Rs.0.00';
        document.getElementById('total').innerHTML = 'Total: Rs.0.00';
        document.getElementById('cart').innerHTML = ''; // Clear cart



    }catch (error) {
        console.error('Error during checkout:', error);
        alert('Checkout failed. Please try again.');
        return;
    }



}