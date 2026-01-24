import os
import requests
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from coolname import generate_slug

load_dotenv()

app = Flask(__name__)

MXROUTE_SERVER = os.getenv("MXROUTE_SERVER")
MXROUTE_USERNAME = os.getenv("MXROUTE_USERNAME")
MXROUTE_API_KEY = os.getenv("MXROUTE_API_KEY")


def build_request(domain):
    mxroute_endpoint = f"https://api.mxroute.com/domains/{domain}/forwarders"
    mxroute_headers = {
        "X-Server": MXROUTE_SERVER,
        "X-Username": MXROUTE_USERNAME,
        "X-API-Key": MXROUTE_API_KEY,
        "Content-Type": "application/json",
    }

    return mxroute_endpoint, mxroute_headers


@app.route("/")
def status():
    return "Bitwarden Mxroute plugin is running."


@app.route("/add/<destination>/<path:subpath>", methods=["POST"])
def add(destination, subpath):
    data = request.get_json()
    domain = data.get("domain")
    endpoint, headers = build_request(domain)

    alias = generate_slug(3)

    body = {
        "alias": alias,
        "destinations": [destination],
    }

    try:
        response = requests.post(endpoint, headers=headers, json=body)
        response.raise_for_status()

        return {"data": {"email": f"{alias}@{domain}"}}
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500


@app.route("/list/<domain>", methods=["GET"])
def get(domain):
    endpoint, headers = build_request(domain)

    try:
        response = requests.get(endpoint, headers=headers)
        response.raise_for_status()

        data = response.json()

        return jsonify(data["data"]), response.status_code
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500
