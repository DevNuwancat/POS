import sqlite3
import os 

def get_connection():
    return sqlite3.connect('products.db')
    
def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price REAL NOT NULL
    )
    ''')

    # Bills (ales records)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS bills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        total REAL NOT NULL,
        paid REAL NOT NULL,
        balance REAL NOT NULL,
        payment_method TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP           
        )
    ''')

    # Bill Items (items inside each sale)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS bill_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bill_id INTEGER NOT NULL,
        product_name TEXT NOT NULL,           
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        FOREIGN KEY (bill_id) REFERENCES bills (id)   
    )
    ''')

    conn.commit()
    conn.close()
