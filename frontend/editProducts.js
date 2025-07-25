
//✅ Load all products from backend and show in 

async function loadProdctsEdit() {
    try{
        const response = await fetch('http://127.0.1:8000/products');
        if(!response.ok){
            console.error('Failed to load products');
            return;
        }

        let countnum = 0;

        const products = await response.json();
        const productsList = document.getElementById('product-edit-list');
        productsList.innerHTML = ''; // Clear previous
        products.forEach(product => {

            countnum++;

            const div = document.createElement('div');
            div.className = 'flex flex-row gap-4  p-1  bg-gray-200/50 items-center rounded-lg mb-2'
            div.innerHTML = `
            <div class="basis-10 text-sm text-left">${countnum}</div>
            <div class="basis-sm text-sm ">${product.name}</div>
            <div class="basis-32 text-sm ">${product.price.toFixed(2)}</div>
            <div class="basis-auto">
            <button class="mx-1 bg-white p-0.5 px-2 rounded-md drop-shadow-2xl
            hover:bg-gray-100 transition-colors duration-300 text-sm"
            onclick="openEditModal(${product.id}, '${product.name}', ${product.price})">Edit</button>
            <button class="mx-1 bg-white p-0.5 px-2 rounded-md drop-shadow-2xl hover:bg-gray-100 transition-colors duration-300 text-sm"
            onclick="deleteProduct(${product.id})"
            >Delete</button>
          </div>
            `;
            productsList.appendChild(div);
        });

    } catch(error) {
        console.error('Error loading products:', error);
    }

}

// ✅ Load products on window load
window.onload = () => {
    loadProdctsEdit();
}

let currentProductId = null;

function openEditModal(id, name, price) {
    currentProductId = id;
    document.getElementById('update-product-name').value = name;
    document.getElementById('update-product-price').value = price.toFixed(2);
    const modal = document.getElementById('editModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');

}

function closeEditModal() {
    const modal = document.getElementById('editModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

async function updateProduct() {
    const name = document.getElementById('update-product-name').value;
    const price = parseFloat(document.getElementById('update-product-price').value);

    if (!name || isNaN(price) || price < 0) {
        alert('Please enter valid product details.');
        return;
    }

    try {
        const response = await fetch(`http://127.0.0.1:8000/products/${currentProductId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, price }) // Convert object to JSON string
        });

        if (response.ok) {
            //alert('Product updated successfully!');
            closeEditModal();
            loadProdctsEdit(); 
        }else{
            alert('Fail to update product. Please try again.');
        }
            
    } catch (error) {
        console.error('Error updating product:', error);
        alert('Failed to update product. Please try again.');
        return;
    }
}

//Delete product
async function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) {
        return;
    }

    try {
        const response = await fetch(`http://127.0.0.1:8000/products/${id}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            alert('Product deleted successfully!');
            loadProdctsEdit(); // Refresh product list
        } else {
            alert('Failed to delete product. Please try again.');
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        alert('Failed to delete product. Please try again.');
    }
}