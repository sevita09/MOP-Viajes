from flask import Flask, jsonify, request, render_template
import json
import uuid
import os

app = Flask(__name__)

DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
TRIPS_FILE = os.path.join(DATA_DIR, 'trips.json')
CITIES_FILE = os.path.join(DATA_DIR, 'cities.json')


def read_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def write_json(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/trips', methods=['GET'])
def get_trips():
    return jsonify(read_json(TRIPS_FILE))


@app.route('/api/trips', methods=['POST'])
def create_trip():
    pass


@app.route('/api/trips/<trip_id>', methods=['PUT'])
def update_trip(trip_id):
    pass


@app.route('/api/trips/<trip_id>', methods=['DELETE'])
def delete_trip(trip_id):
    pass


@app.route('/api/cities', methods=['GET'])
def get_cities():
    return jsonify(read_json(CITIES_FILE))


@app.route('/api/cities', methods=['POST'])
def create_city():
    pass


@app.route('/api/geocode')
def geocode():
    pass


if __name__ == '__main__':
    app.run(debug=True)
