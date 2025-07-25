async function loadDailySales() {
    try{
        const response = await fetch('http://127.0.1:8000/sales/today');
        if(!response.ok){
            console.error('Failed to fetch daily sales data:', response.statusText);
            alert('Error loading daily sales data. Please try again later.');
            return;
        }

        const data = await response.json();
        const salesContainer = document.getElementById('salesContainer');
        salesContainer.innerHTML = ''; // Clear previous data

        const totaldashboard = document.getElementById('totalSum');
        totaldashboard.innerHTML = `Total Income: ${data.total_sales.toFixed(2)}`; 

        const todayDate = document.getElementById('todayDate');
        todayDate.innerHTML = data.date;

       
        // Display total sales

        let totalSalesCount = 0;

        data.bills.forEach(element => {
            totalSalesCount++;

            const formattedTime = new Date(element.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Colombo'  });
            // Build item details section
            const productsList = element.items.map(item => `
                <div class="flex flex-row items-center gap-2 p-1 mb-0.5">
                <div class="text-xs basis-6">${item.quantity}x</div>
                <div class="text-xs basis-48">${item.product_name}</div>
                <div class="text-xs">${item.price.toFixed(2)}</div>
            </div>
            `).join('');

            const div = document.createElement('div');
            div.className = 'border border-gray-300/90 rounded-lg mb-4';
            div.innerHTML = `
            <div class="flex flex-row gap-4  p-1 bg-gray-200/70 items-center mb-2 ">
            <div class="basis-18 text-sm text-left">${formattedTime}</div>
            <div class="basis-32 text-sm ">${element.total}</div>
            <div class="basis-32 text-sm ">${element.paid}</div>
            <div class="basis-32 text-sm ">${element.balance}</div>
            <div class="basis-32 text-sm ">${element.payment_method}</div>
            <div class="basis- text-right">
            
            </div>
        </div>
        <div class="Product-details" id="productsModal">
            ${productsList}
        </div>
            `;

            salesContainer.appendChild(div);
        });

         const salesCount = document.getElementById('salesCount');
        salesCount.innerHTML = totalSalesCount;


    }catch(error){
        console.error('Error loading products:', error);
        alert('Error loading daily sales data. Please try again later.');
    }
}

window.onload = () => {
    loadDailySales();
}

function showProducts(){
    const modal = document.getElementById('productsModal');
    modal.classList.remove('hidden');
}