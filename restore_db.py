import csv
import pymysql
import os
import glob
import getpass

# Database credentials
DB_HOST = "mysql-grupopg-santifernandez652-abd8.h.aivencloud.com"
DB_PORT = 19922
DB_USER = "avnadmin"
# Read password from environment variable DB_PASS, or fallback to prompt
DB_PASS = os.environ.get("DB_PASS")
if not DB_PASS:
    print("No DB_PASS environment variable detected.")
    DB_PASS = getpass.getpass("Please enter the Aiven DB Password: ")

CSV_DIR = r"C:\Users\santi\OneDrive\Escritorio\bdge"

def get_latest_csv(table_name):
    pattern = os.path.join(CSV_DIR, f"{table_name}_*.csv")
    files = glob.glob(pattern)
    if not files:
        exact_pattern = os.path.join(CSV_DIR, f"{table_name}.csv")
        if os.path.exists(exact_pattern):
            return exact_pattern
        raise FileNotFoundError(f"No CSV files found for table '{table_name}' in {CSV_DIR}")
    files.sort()
    return files[-1]

def parse_value(table_name, field_name, val):
    if val == "" or val == "None":
        return None
        
    # Convert bit(1) fields to integers (1 or 0)
    if table_name == "obras" and field_name == "finalizada":
        try:
            return int(float(val))
        except ValueError:
            return 1 if str(val).lower() in ("true", "t", "yes", "y", "1") else 0
            
    if table_name == "asistencias" and field_name == "ha_asistido":
        try:
            return int(float(val))
        except ValueError:
            return 1 if str(val).lower() in ("true", "t", "yes", "y", "1") else 0
            
    # Try converting other numeric columns to prevent string representation issues if needed
    if field_name in ("id", "id_obra", "id_trabajador"):
        try:
            return int(val)
        except ValueError:
            pass
            
    if field_name in ("horas_trabajadas", "horas_jornada", "pago_diario", "precio_neto", "precio_pvp", "uds_horas", "pago_dia"):
        try:
            return float(val)
        except ValueError:
            pass

    return val

def import_table(cursor, table_name, csv_path):
    print(f"Importing {csv_path} into table '{table_name}'...")
    
    with open(csv_path, encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fields = reader.fieldnames
        rows = list(reader)
        
    if not rows:
        print(f"  No data found in {csv_path}. Skipping insert.")
        return
        
    # Build query
    cols_str = ", ".join([f"`{field}`" for field in fields])
    placeholders = ", ".join(["%s"] * len(fields))
    insert_query = f"INSERT INTO `{table_name}` ({cols_str}) VALUES ({placeholders})"
    
    data_to_insert = []
    for row in rows:
        row_values = []
        for field in fields:
            val = row[field]
            parsed = parse_value(table_name, field, val)
            row_values.append(parsed)
        data_to_insert.append(row_values)
        
    cursor.executemany(insert_query, data_to_insert)
    print(f"  Successfully inserted {len(rows)} rows into '{table_name}'.")

def main():
    connection = pymysql.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASS,
        database=DB_NAME,
        ssl={"ssl": {}}
    )
    
    try:
        with connection.cursor() as cursor:
            # 1. Disable constraints
            cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
            
            # Truncate partidas table if it exists (so they are fresh generated)
            try:
                cursor.execute("TRUNCATE TABLE `partidas`")
            except Exception:
                pass

            tables_to_import = [
                ("usuarios", "usuarios"),
                ("trabajadores", "trabajadores"),
                ("obras", "obras"),
                ("gastos_obra", "gastos_obra"),
                ("asistencias", "asistencias")
            ]
            
            for table_name, csv_prefix in tables_to_import:
                csv_path = get_latest_csv(csv_prefix)
                # Clear existing data
                cursor.execute(f"TRUNCATE TABLE `{table_name}`")
                # Import new data
                import_table(cursor, table_name, csv_path)
                
            # 2. Re-enable constraints
            cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")
            
        connection.commit()
        print("\nDatabase sync/restore completed successfully!")
    except Exception as e:
        connection.rollback()
        print(f"\nError during database import: {e}")
        raise e
    finally:
        connection.close()

if __name__ == "__main__":
    main()
