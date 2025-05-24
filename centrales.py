import requests
import time
import os
from datetime import datetime

# Configuración de caché
CACHE_FILE = 'cache'
CACHE_DIR = 'cache'

# Lista de centrales
CENTRALES = [
    "Gatún 1", "Gatún 2", "Gatún 3", "Gatún 4", "Gatún 5", "Gatún 6",
    "Madden 1", "Madden 2", "Madden 3",
    "ACP Miraflores 5", "ACP Miraflores 9", "ACP Miraflores 10"
]

def get_cache():
    try:
        with open(os.path.join(CACHE_DIR, CACHE_FILE), 'r') as f:
            return f.read()
    except FileNotFoundError:
        return ""

def save_cache(data):
    os.makedirs(CACHE_DIR, exist_ok=True)
    with open(os.path.join(CACHE_DIR, CACHE_FILE), 'w') as f:
        f.write(data)

def get_centrales_data():
    # Configuración de la sesión
    session = requests.Session()
    session.verify = False
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
    })

    # Obtener datos de generación
    try:
        response = session.get(
            "https://sitr.cnd.com.pa/m/pub/data/gen.json?1660935351684",
            timeout=2
        )
        response.raise_for_status()
        data = response.text
    except requests.RequestException as e:
        return f"Error: {str(e)[:8]}"

    # Procesar datos de centrales
    salida = str(int(time.time()))
    for central in CENTRALES:
        try:
            pos_ini = data.find(central) + len(central) + 20
            pos_fin = data.find('"', pos_ini)
            if data[pos_fin + 21:pos_fin + 24] == "222":
                salida += ',' + data[pos_ini:pos_fin]
            else:
                salida += ',Off Line'
        except:
            salida += ',Off Line'

    # Obtener niveles de lagos
    try:
        response = session.get(
            "http://radar-meteorologico.delcanal.com/lakeLevels.txt",
            timeout=2
        )
        response.raise_for_status()
        data = response.text
    except requests.RequestException:
        return salida

    # Procesar datos de lagos
    try:
        # Fecha y hora
        pos_ini = data.find('FECHA:') + 6
        pos_fin = data.find('HORA:', pos_ini)
        fecha_act = data[pos_ini:pos_fin].strip()
        
        pos_ini = pos_fin + 5
        pos_fin = data.find(':', pos_ini) + 3
        fecha_act += ' T ' + data[pos_ini:pos_fin].strip()

        # Nivel Gatún
        pos_ini = data.find('GATUN') + 30
        pos_fin = data.find('.', pos_ini) + 3
        gatun = data[pos_ini:pos_fin].strip()

        # Nivel Alhajuela
        pos_ini = data.find('ALHAJUELA') + 30
        pos_fin = data.find('.', pos_ini) + 3
        alhajuela = data[pos_ini:pos_fin].strip()

        # Nivel Limón
        pos_ini = data.find('Limon') + 30
        pos_fin = data.find('.', pos_ini) + 3
        limon = data[pos_ini:pos_fin].strip()

        salida += f',{fecha_act},{alhajuela},{fecha_act},{gatun},{limon}'
    except:
        pass

    return salida

def main():
    # Verificar caché
    cache = get_cache()
    current_time = int(time.time())
    
    if cache and current_time < (2 + int(cache[:10])):
        print(cache)
        return

    # Obtener nuevos datos
    salida = get_centrales_data()
    save_cache(salida)
    print(salida)

if __name__ == "__main__":
    main() 