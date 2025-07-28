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
        totaldashboard.innerHTML = `Daily Income: <span style="font-weight: bold;">${data.total_sales.toFixed(2)}</span>`; 

        const todayDate = document.getElementById('todayDate');
        todayDate.innerHTML = data.date;

       
        // Display total sales

        let totalSalesCount = 0;

        data.bills.forEach(element => {
            totalSalesCount++;

            const formattedTime = new Date(element.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Colombo'  }).toUpperCase();
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
        <div class="Product-details text-gray-400" id="productsModal">
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


function printDailySales(){
 alert('Printing daily sales is not implemented yet.');
    // Implement the print functionality here
    // You can use html2pdf.js to convert the content to PDF and then print it
    // Example:
    // const element = document.getElementById('salesContainer');
    // html2pdf().from(element).save('daily_sales.pdf');
}


async function printPDF() {

const salesContainer = document.getElementById('salesContainer');
try {
    const response = await fetch('http://127.0.0.1:8000/sales/today');
    if (!response.ok) {
      alert('Failed to fetch sales data');
      return;
    }

    const data = await response.json();

    const today = data.date;
    const totalSales = data.total_sales.toFixed(2);
    const salesCount = data.bills.length;

    const element = document.createElement('div');

    let html = `
      <div style="font-family: Arial, sans-serif; font-size: 12px; color: #000; background: #fff; padding: 20px;">
        <img src="/static/icons/logo.png" alt="Logo" style="width: 100px; height: auto; margin-bottom: 20px;">
        <h2 style="font-size:18px; font-weight:bold;">Daily Sales Report</h2>
        <p><strong>Date:</strong> ${today}</p>
        <p><strong>Total Sales:</strong> Rs. ${totalSales}</p>
        <p><strong>Total Sales Count:</strong> ${salesCount}</p>
        <hr style="margin-top: 10px; margin-bottom: 10px;">
    `;

    data.bills.forEach((bill, index) => {
      const time = new Date(bill.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Colombo'
      });

      html += `
        <div style="margin-bottom: 15px;">
          <p><strong>Bill ${index + 1}</strong></p>
          <p>Time: ${time}</p>
          <p>Total: Rs. ${bill.total}</p>
          <p>Paid: Rs. ${bill.paid}</p>
          <p>Balance: Rs. ${bill.balance}</p>
          <p>Payment Method: ${bill.payment_method}</p>
          <p><strong>Items:</strong></p>
          <ul style="margin-left: 5px;">
      `;

      bill.items.forEach(item => {
        html += `<li>${item.quantity}x ${item.product_name} - Rs. ${item.price.toFixed(2)}</li>`;
      });

      html += `
          </ul>
          <hr style="margin-top: 10px; margin-bottom: 10px; border-color: #e5e7eb;">
        </div>
      `;
    });

    html += `</div>`;
    element.innerHTML = html;

    html2pdf().set({
      margin: 0.3,
      filename: `Daily_Sales_Report_${today}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    }).from(element).save();

  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('PDF generation failed.');
  }
}

async function deleteCheckout() {
  try {
    const response = await fetch('http://127.0.0.1:8000/checkout/today', {
      method: 'DELETE'
    });
    if (!response.ok) {
      throw new Error('Failed to delete checkout');
    }
    alert('Checkout deleted successfully');
    loadDailySales(); // Refresh the daily sales data
  } catch (error) {
    console.error('Error deleting checkout:', error);
    alert('Error deleting checkout. Please try again later.');
  }
}
