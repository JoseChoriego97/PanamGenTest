from flask import Flask, jsonify, request, render_template
import requests
from bs4 import BeautifulSoup

app = Flask(__name__)

# Ruta para servir el frontend
@app.route('/')
def index():
    return render_template('index.html')


def limpiar_texto(texto):
    # Re-codificar el texto utilizando 'latin1' y luego decodificarlo a 'utf-8'
    try:
        texto_limpio = texto.encode('latin1').decode('utf-8')
        # Elimina apóstrofes (tanto los normales como los especiales)
        texto_sin_apostrofes = texto_limpio.replace("'", "").replace("’", "")
    except UnicodeEncodeError:
        texto_limpio = texto  # Si hay un error, devolver el texto tal como está
    return texto_limpio



# Ruta principal, para actualizar y realizar el scrapping de la pagina de energia

@app.route('/update-data', methods=['GET'])
def update_data():
    url = "https://sitr.cnd.com.pa/m/pub/gen.html"
    try:
        response = requests.get(url)
        response.raise_for_status()

        # Se define el objeto del DOM a scrapear
        soup = BeautifulSoup(response.text, 'html.parser')

        # Definir los vectores de los tipos de plantas
        generation_data = []
        type_plant_index = 0
        type_plant_vec = ["Hidroelectricas", "Termicas", "Solares", "Eolicas"]

        # Scrapeo de datos desde la tabla
        for row in soup.select('tbody'):
            columns = row.find_all('span')

            if len(columns) > 1:
                type_plant = type_plant_vec[type_plant_index]
                grouped_columns = [columns[i:i+2] for i in range(0, len(columns), 2)]
                type_plant_index += 1

                for genindex in range(len(grouped_columns)):
                    generator = limpiar_texto(grouped_columns[genindex][0].text.strip())
                    percentage = float(grouped_columns[genindex][1].text.strip().replace('%', ''))

                    generation_data.append({
                        'generator': generator,
                        'type': type_plant,
                        'percentage': percentage
                    })

        # Paso 1: Sumar los porcentajes para cada tipo de planta
        type_summary = {}
        total_percentage = 0

        for data in generation_data:
            type_summary[data['type']] = type_summary.get(data['type'], 0) + data['percentage']
            total_percentage += data['percentage']

        # Paso 2: Calcular el porcentaje total para cada tipo de planta
        true_percentage_summary = {}
        for energy_type, percentage in type_summary.items():
            true_percentage_summary[energy_type] = (percentage / total_percentage) * 100

        # Paso 3: Calcular el porcentaje por generador respecto al tipo de planta
        generator_percentage_by_type = {}
        for data in generation_data:
            if data['type'] not in generator_percentage_by_type:
                generator_percentage_by_type[data['type']] = []

            # Calcular porcentaje respecto al tipo de planta
            type_total_percentage = type_summary[data['type']]
            relative_percentage = (data['percentage'] / type_total_percentage) * 100
            generator_percentage_by_type[data['type']].append({
                'generator': data['generator'],
                'percentage': relative_percentage
            })

        return jsonify({
            'success': True,
            'generation_data': generation_data,  # Datos originales
            'type_summary': true_percentage_summary,  # Resumen por tipo
            'generator_percentage_by_type': generator_percentage_by_type  # Porcentaje por generador respecto a tipo
        })

    except requests.exceptions.RequestException as e:
        return jsonify({
            'success': False,
            'message': 'Error al obtener los datos',
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)