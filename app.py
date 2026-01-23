import os
import requests
from dotenv import load_dotenv
from flask import Flask, request, jsonify

load_dotenv()

app = Flask(__name__)

SERVER = os.getenv("MXROUTE_SERVER")
USERNAME = os.getenv("MXROUTE_USERNAME")
API_KEY = os.getenv("MXROUTE_API_KEY")


def build_request(domain):
    mxroute_endpoint = f"https://api.mxroute.com/domains/{domain}/forwarders"
    mxroute_headers = {
        "X-Server": SERVER,
        "X-Username": USERNAME,
        "X-API-Key": API_KEY,
        "Content-Type": "application/json",
    }

    return mxroute_endpoint, mxroute_headers


@app.route("/")
def status():
    return "Bitwarden Mxroute plugin is running."


@app.route("/list/<domain>", methods=["GET"])
def get(domain):
    endpoint, headers = build_request(domain)

    try:
        response = requests.get(endpoint, headers=headers)
        response.raise_for_status()

        return jsonify(response.json()), response.status_code
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500


@app.route("/add/<destination>/<path:subpath>", methods=["POST"])
def add(destination, subpath):
    data = request.get_json()
    domain = data.get("domain")
    endpoint, headers = build_request(domain)

    alias = "teste2"

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


@app.route("/test", methods=["GET"])
def test():
    destination = request.args.get("destination")

    return destination


if __name__ == "__main__":
    app.run()
