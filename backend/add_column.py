import sqlite3

try:
    conn = sqlite3.connect('whatsapp_clone.db')
    cursor = conn.cursor()
    cursor.execute("ALTER TABLE statuses ADD COLUMN background_color VARCHAR;")
    conn.commit()
    conn.close()
    print("Column added successfully!")
except Exception as e:
    print(f"Error: {e}")
