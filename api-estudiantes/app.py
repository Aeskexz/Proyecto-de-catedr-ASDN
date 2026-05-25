import os
import pyodbc
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()  # Carga las variables del archivo .env

app = Flask(__name__)
CORS(app)

@app.route("/")
def home():
    return jsonify({
        "mensaje": "API funcionando correctamente en Azure"
    })

# Configuración de conexión desde variable de entorno
conn_str = os.environ.get("DB_CONNECTION_STRING")

def get_db_connection():
    conn_str = os.environ.get("DB_CONNECTION_STRING")
    return pyodbc.connect(conn_str)

# ---------- ENDPOINTS ----------

@app.route('/api/students', methods=['GET'])
def get_students():
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, Nombres, Apellidos, NumeroCarnet, Edad FROM Estudiantes")
        rows = cursor.fetchall()
        students = []
        for row in rows:
            students.append({
                "id": row[0],
                "nombres": row[1],
                "apellidos": row[2],
                "numeroCarnet": row[3],
                "edad": row[4]
            })
        return jsonify(students), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@app.route('/api/students', methods=['POST'])
def create_student():
    conn = None
    cursor = None
    data = request.get_json()
    nombres = data.get('nombres')
    apellidos = data.get('apellidos')
    carnet = data.get('numeroCarnet')
    edad = data.get('edad')

    if not all([nombres, apellidos, carnet, edad]):
        return jsonify({"error": "Faltan campos obligatorios"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO Estudiantes (Nombres, Apellidos, NumeroCarnet, Edad) VALUES (?, ?, ?, ?)",
            (nombres, apellidos, carnet, edad)
        )
        conn.commit()
        return jsonify({"message": "Estudiante creado correctamente"}), 201
    except pyodbc.Error:
        return jsonify({"error": "El número de carnet ya existe"}), 409
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@app.route('/api/students/<int:id>', methods=['DELETE'])
def delete_student(id):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM Estudiantes WHERE id = ?", (id,))
        if cursor.rowcount == 0:
            return jsonify({"error": "Estudiante no encontrado"}), 404
        conn.commit()
        return jsonify({"message": "Estudiante eliminado"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')