from flask import Flask, jsonify, request, render_template
import json
import uuid
import os
import urllib.request
import urllib.parse

app = Flask(__name__)

DATA_DIR    = os.path.join(os.path.dirname(__file__), 'data')
TRIPS_FILE  = os.path.join(DATA_DIR, 'trips.json')
CITIES_FILE = os.path.join(DATA_DIR, 'cities.json')

CONTINENT_MAP = {
    # Europa
    'ad':'Europa','al':'Europa','at':'Europa','ba':'Europa','be':'Europa',
    'bg':'Europa','by':'Europa','ch':'Europa','cy':'Europa','cz':'Europa',
    'de':'Europa','dk':'Europa','ee':'Europa','es':'Europa','fi':'Europa',
    'fr':'Europa','gb':'Europa','gr':'Europa','hr':'Europa','hu':'Europa',
    'ie':'Europa','is':'Europa','it':'Europa','li':'Europa','lt':'Europa',
    'lu':'Europa','lv':'Europa','mc':'Europa','md':'Europa','me':'Europa',
    'mk':'Europa','mt':'Europa','nl':'Europa','no':'Europa','pl':'Europa',
    'pt':'Europa','ro':'Europa','rs':'Europa','ru':'Europa','se':'Europa',
    'si':'Europa','sk':'Europa','sm':'Europa','tr':'Europa','ua':'Europa',
    'va':'Europa','xk':'Europa',
    # Asia
    'af':'Asia','am':'Asia','az':'Asia','bd':'Asia','bh':'Asia','bn':'Asia',
    'bt':'Asia','cn':'Asia','ge':'Asia','id':'Asia','il':'Asia','in':'Asia',
    'iq':'Asia','ir':'Asia','jo':'Asia','jp':'Asia','kh':'Asia','kp':'Asia',
    'kr':'Asia','kw':'Asia','kz':'Asia','la':'Asia','lb':'Asia','lk':'Asia',
    'mm':'Asia','mn':'Asia','mo':'Asia','mv':'Asia','my':'Asia','np':'Asia',
    'om':'Asia','ph':'Asia','pk':'Asia','ps':'Asia','qa':'Asia','sa':'Asia',
    'sg':'Asia','sy':'Asia','th':'Asia','tj':'Asia','tl':'Asia','tm':'Asia',
    'tw':'Asia','uz':'Asia','vn':'Asia','ye':'Asia',
    # África
    'ao':'África','bf':'África','bi':'África','bj':'África','bw':'África',
    'cd':'África','cf':'África','cg':'África','ci':'África','cm':'África',
    'cv':'África','dj':'África','dz':'África','eg':'África','er':'África',
    'et':'África','ga':'África','gh':'África','gm':'África','gn':'África',
    'gq':'África','gw':'África','ke':'África','km':'África','lr':'África',
    'ls':'África','ly':'África','ma':'África','mg':'África','ml':'África',
    'mr':'África','mu':'África','mw':'África','mz':'África','na':'África',
    'ne':'África','ng':'África','rw':'África','sc':'África','sd':'África',
    'sl':'África','sn':'África','so':'África','ss':'África','st':'África',
    'sz':'África','td':'África','tg':'África','tn':'África','tz':'África',
    'ug':'África','za':'África','zm':'África','zw':'África',
    # América del Norte
    'ag':'América del Norte','bb':'América del Norte','bs':'América del Norte',
    'bz':'América del Norte','ca':'América del Norte','cr':'América del Norte',
    'cu':'América del Norte','dm':'América del Norte','do':'América del Norte',
    'gd':'América del Norte','gt':'América del Norte','hn':'América del Norte',
    'ht':'América del Norte','jm':'América del Norte','kn':'América del Norte',
    'lc':'América del Norte','mx':'América del Norte','ni':'América del Norte',
    'pa':'América del Norte','sv':'América del Norte','tt':'América del Norte',
    'us':'América del Norte','vc':'América del Norte',
    # América del Sur
    'ar':'América del Sur','bo':'América del Sur','br':'América del Sur',
    'cl':'América del Sur','co':'América del Sur','ec':'América del Sur',
    'gy':'América del Sur','pe':'América del Sur','py':'América del Sur',
    'sr':'América del Sur','uy':'América del Sur','ve':'América del Sur',
    # Oceanía
    'au':'Oceanía','fj':'Oceanía','fm':'Oceanía','ki':'Oceanía','mh':'Oceanía',
    'nr':'Oceanía','nz':'Oceanía','pw':'Oceanía','pg':'Oceanía','sb':'Oceanía',
    'to':'Oceanía','tv':'Oceanía','vu':'Oceanía','ws':'Oceanía',
}


def read_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def write_json(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


@app.route('/')
def index():
    return render_template('index.html')


# ── Trips ──────────────────────────────────────────────────────────

@app.route('/api/trips', methods=['GET'])
def get_trips():
    return jsonify(read_json(TRIPS_FILE))


@app.route('/api/trips', methods=['POST'])
def create_trip():
    data = request.get_json()
    trips = read_json(TRIPS_FILE)
    new_trip = {
        'id':        'trip_' + uuid.uuid4().hex[:8],
        'name':      data['name'],
        'startDate': data['startDate'],
        'endDate':   data['endDate'],
        'cityIds':   data['cityIds'],
    }
    trips.append(new_trip)
    write_json(TRIPS_FILE, trips)
    return jsonify(new_trip), 201


@app.route('/api/trips/<trip_id>', methods=['PUT'])
def update_trip(trip_id):
    pass


@app.route('/api/trips/<trip_id>', methods=['DELETE'])
def delete_trip(trip_id):
    pass


# ── Cities ─────────────────────────────────────────────────────────

@app.route('/api/cities', methods=['GET'])
def get_cities():
    return jsonify(read_json(CITIES_FILE))


@app.route('/api/cities', methods=['POST'])
def create_city():
    data = request.get_json()
    cities = read_json(CITIES_FILE)

    # Reutilizar ciudad existente si coincide lat/lng (4 decimales)
    lat = round(float(data['lat']), 4)
    lng = round(float(data['lng']), 4)
    for city in cities:
        if round(city['lat'], 4) == lat and round(city['lng'], 4) == lng:
            return jsonify(city)

    new_city = {
        'id':          'city_' + uuid.uuid4().hex[:8],
        'name':        data['name'],
        'country':     data['country'],
        'countryCode': data['countryCode'],
        'continent':   data['continent'],
        'lat':         float(data['lat']),
        'lng':         float(data['lng']),
    }
    cities.append(new_city)
    write_json(CITIES_FILE, cities)
    return jsonify(new_city), 201


# ── Geocode proxy ──────────────────────────────────────────────────

@app.route('/api/geocode')
def geocode():
    q = request.args.get('q', '').strip()
    if not q:
        return jsonify([])

    params = urllib.parse.urlencode(
        {'q': q, 'format': 'json', 'limit': 5, 'addressdetails': 1}
    )
    url = f'https://nominatim.openstreetmap.org/search?{params}'

    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'MOP-Viajes/1.0'})
        with urllib.request.urlopen(req, timeout=5) as resp:
            results = json.loads(resp.read().decode())
    except Exception:
        return jsonify([])

    simplified = []
    for item in results:
        addr         = item.get('address', {})
        country_code = addr.get('country_code', '').lower()
        name = (
            addr.get('city') or addr.get('town') or addr.get('village') or
            addr.get('municipality') or addr.get('county') or
            item.get('display_name', '').split(',')[0]
        )
        simplified.append({
            'name':        name.strip(),
            'country':     addr.get('country', ''),
            'countryCode': country_code.upper(),
            'continent':   CONTINENT_MAP.get(country_code, 'Otros'),
            'lat':         float(item['lat']),
            'lng':         float(item['lon']),
        })

    return jsonify(simplified)


if __name__ == '__main__':
    app.run(debug=True)
