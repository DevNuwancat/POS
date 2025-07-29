import sqlite3
from fastapi import FastAPI, HTTPException, Path
from backend.database import init_db, get_connection
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from typing import List
from fastapi.responses import FileResponse
from pydantic import BaseModel
from escpos.printer import File, Usb
from datetime import datetime, date
import os



app = FastAPI()
init_db()  # Initialize the database


#Save Files

# Allow the frontend to access the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],  # Allows all methods (GET, POST, etc.)
)

#app.mount("/static", StaticFiles(directory="static"), name="static") # mount static files

"""
# Sample data for products
products = [
    {"id": 1, "name": "Coffee", "price": 10.00},
    {"id": 2, "name": "Tea", "price": 5.00},
    {"id": 3, "name": "Juice", "price": 7.00},
    {"id": 4, "name": "Soda", "price": 3.50},
    
]
"""



# next_product_id = len(products) + 1 

class Product(BaseModel):
    name: str
    price: float

class Item(BaseModel):
    product_name: str
    quantity: int
    price: float

class CheckoutData(BaseModel):
    items:List[Item]
    total: float
    paid: float
    balance: float
    payment_method: str


@app.get("/products")
# def get_products():
#    return products

def get_products():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, price FROM products")
    rows = cursor.fetchall()
    conn.close()
    return [{"id": row[0], "name": row[1], "price": row[2]} for row in rows]


# EndPoint to serve the add_products.html page

# Mount frontend files
# app.mount("/frontend", StaticFiles(directory="frontend"), name="frontend")

# Mount static and frontend folders
app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount("/frontend", StaticFiles(directory="frontend"), name="frontend")

@app.get("/")
def serve_frontend():
    return FileResponse("frontend/index.html")

@app.get("/add_products")
def add_product_page():
    return FileResponse("frontend/add_products.html")

@app.get("/show_products")
def show_products_page():
    return FileResponse("frontend/show_products.html")

@app.get("/daily_sales")
def daily_sales_page():
    return FileResponse("frontend/daily_sales.html")



@app.post("/products")    

def create_product(product: Product):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO products (name, price) VALUES (?, ?)", (product.name, product.price))
    conn.commit()
    new_product_id = cursor.lastrowid
    conn.close()
    
    return {"id": new_product_id, "name": product.name, "price": product.price}

#def create_product(product: Product):
#    global next_product_id
#    new_product ={
#        "id": next_product_id,
#        "name": product.name,
#        "price": product.price
#    } 
#    products.append(new_product)
#    next_product_id += 1
#    return new_product   


@app.put("/products/{product_id}")
def update_product(product_id: int, product: Product):
    conn =get_connection()
    cursor = conn.cursor()

    # Check if the product exists
    cursor.execute("SELECT * FROM products WHERE id = ?", (product_id,))
    existing = cursor.fetchone()

    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Update the product
    cursor.execute("UPDATE products SET name = ?, price = ? WHERE id = ?", (product.name, product.price, product_id))
    conn.commit()
    conn.close()

    return {"id": product_id, "name": product.name, "price": product.price}

# Delete product
@app.delete("/products/{product_id}")
def delete_product(product_id: int):
    conn = get_connection()
    cursor = conn.cursor()

    # Check if product exits 
    cursor.execute("SELECT *  FROM products WHERE id = ?", (product_id,))
    existing = cursor.fetchone()
    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Delete the product
    cursor.execute("DELETE FROM products WHERE id = ?", (product_id,))
    conn.commit()
    conn.close()

    return {"message": "Product deleted successfully"}


@app.delete("/checkout/today")
def delete_checkout():
    conn = get_connection()
    cursor = conn.cursor()

    # Get today's date
    today_date = date.today().strftime("%Y-%m-%d")

    # Delete the bill
    cursor.execute("DELETE FROM bills WHERE DATE(timestamp) = ?", (today_date,))
    bill_ids = [row[0] for row in cursor.fetchall()]

    # Delete related bill_items
    if bill_ids:
        cursor.executemany("DELETE FROM bill_items WHERE bill_id = ?", [(bid,) for bid in bill_ids])

    # Delete bills
    cursor.execute("DELETE FROM bills WHERE DATE(timestamp) = ?", (today_date,))

    conn.commit()
    conn.close()

    return {"message": "Today's checkouts deleted successfully"}




# Checkout endpoint Record Sales
@app.post("/checkout")
def checkout(data: CheckoutData):
    conn = get_connection()
    cursor = conn.cursor()

    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Insert the bill
    cursor.execute("""
    INSERT INTO bills (total, paid, balance, payment_method, timestamp)
    VALUES (?, ?, ?, ?, ?)
    """, (data.total, data.paid, data.balance, data.payment_method, now))
    bill_id = cursor.lastrowid

    # Insert each item in the bill
    for item in data.items:
        cursor.execute("""
        INSERT INTO bill_items (bill_id, product_name, quantity, price)
        VALUES (?, ?, ?, ?)
        """, (bill_id, item.product_name, item.quantity, item.price))
    conn.commit()
    conn.close()

    # == ESC/POS == # 

    try:
        #printer = File("recept/lp1.txt") 
        printer = Usb(0x1fc9, 0x2016)


        now = datetime.now()
        timestamp_str = now.strftime("%Y-%m-%d %H:%M:%S")

        # 2️⃣ Print receipt content
        # Header
        printer.set(align='center', font='a', width=3, height=3)
        printer.text("Teeny Treats\n\n")

        printer.set(align='left', font='a', width=1, height=1)
        printer.text(f"Date           : {timestamp_str}\n")
        printer.text(f"Payment Method : {data.payment_method}\n")
        printer.text("-" * 32 + "\n")

        # Items
        for item in data.items:
            name = item.product_name[:16].ljust(16)  # max 16 chars for small printer
            qty = str(item.quantity).rjust(2)
            price = f"Rs.{item.price:.2f}"
            total = f"Rs.{item.quantity * item.price:.2f}"
            line = f"{name}{qty} x {price} = {total}\n"
            printer.text(line)

        printer.text("-" * 32 + "\n")

        # Totals
        printer.text(f"{'Total'.ljust(20)}: Rs.{data.total:.2f}\n")
        printer.text(f"{'Paid'.ljust(20)}: Rs.{data.paid:.2f}\n")
        printer.text(f"{'Balance'.ljust(20)}: Rs.{data.balance:.2f}\n")

        printer.text("\n")
        printer.set(align='center', font='a', width=2, height=2)
        printer.text("Thank you! Come again!\n\n")


        # Trigger Cash Drawer
        printer.cashdraw(2)
        printer.cut()
    
    except Exception as e:
        print(f"Error printing receipt: {e}")
        raise HTTPException(status_code=500, detail="Print failed. Please check printer connection")

    return {"message": "Checkout successful"}


@app.get("/sales/today")
def get_today_sales():
    conn = get_connection()
    cursor = conn.cursor()

    # Get today's date 
    today_date = date.today().strftime("%Y-%m-%d")

    cursor.execute("""
    SELECT id,total, paid, balance, payment_method, timestamp
    FROM bills
    WHERE DATE(timestamp) = ?
    """, (today_date,))
    bills = cursor.fetchall()

    cursor.execute("""
    SELECT IFNULL(SUM(total),0) FROM bills WHERE DATE(timestamp) = ?
    """, (today_date,))
    total_sales = cursor.fetchone()[0]

    #For each bill, get the sold items
    bill_data = []
    for bill in bills:
        bill_id = bill[0]

        cursor.execute("""
        SELECT product_name, quantity, price
        FROM bill_items
        WHERE bill_id = ?
        """, (bill_id,))
        items = cursor.fetchall()

        item_list = [
            {
                "product_name": item[0],
                "quantity": item[1],
                "price": item[2]                               
            }
            for item in items
        ]

        bill_data.append({
            "id":bill[0],
            "total": bill[1],
            "paid": bill[2],
            "balance": bill[3],
            "payment_method": bill[4],
            "timestamp": bill[5],
            "items": item_list
        })

    conn.close()

    return {
        "date":today_date,
        "total_sales": total_sales,
        "bills": bill_data
    }
    


