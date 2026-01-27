from typing import Dict
import secrets
import os
import re
import requests
import coolname
from dotenv import load_dotenv
from flask import Flask, request, jsonify

load_dotenv()

app = Flask(__name__)

SERVER_API_TOKEN = os.getenv("SERVER_API_TOKEN")

MXROUTE_SERVER = os.getenv("MXROUTE_SERVER")
MXROUTE_USERNAME = os.getenv("MXROUTE_USERNAME")
MXROUTE_API_KEY = os.getenv("MXROUTE_API_KEY")

ALLOWED_TEMPLATE_PARTS = ["slug", "hex"]


def build_request(domain):
    mxroute_endpoint = f"https://api.mxroute.com/domains/{domain}/forwarders"
    mxroute_headers = {
        "X-Server": MXROUTE_SERVER,
        "X-Username": MXROUTE_USERNAME,
        "X-API-Key": MXROUTE_API_KEY,
        "Content-Type": "application/json",
    }

    return mxroute_endpoint, mxroute_headers


def get_options(request_options):
    options: Dict[str, str] = {}
    for option in request_options:
        if "=" in option:
            key, value = option.split("=", 1)
            options[key] = value

    domain = options.get("domain")
    destination = options.get("destination")
    if not domain or not destination:
        raise requests.exceptions.InvalidJSONError(
            f"The 'domain' and 'destination' options are required to be configured."
        )

    template = options.get("template", "<slug>")
    prefix = options.get("prefix") or ""
    suffix = options.get("suffix") or ""
    alias_separator = options.get("alias_separator") or "_"
    slug_separator = options.get("slug_separator") or "_"
    slug_length_str = options.get("slug_length") or ""
    hex_length_str = options.get("hex_length") or ""

    slug_length = 2 if slug_length_str == "" else int(slug_length_str)
    hex_length = 6 if hex_length_str == "" else int(hex_length_str)

    template_parts = []
    for match in re.findall(r"<(.*?)>", template):
        template_parts.append(match)

    alias_parts = []
    for index, part in enumerate(template_parts):
        if not part in ALLOWED_TEMPLATE_PARTS:
            raise requests.exceptions.InvalidJSONError(
                f"Template part '{part}' is not allowed."
            )

        match part:
            case "slug":
                alias_parts.append(slug_separator.join(coolname.generate(slug_length)))
            case "hex":
                alias_parts.append(secrets.token_hex(int(hex_length / 2)))

    alias = alias_separator.join(alias_parts)

    if prefix != "":
        alias = f"{prefix}{alias_separator}{alias}"
    if suffix != "":
        alias += f"{alias_separator}{suffix}"

    return {"domain": domain, "destination": destination, "alias": alias}


@app.before_request
def check_auth():
    if request.endpoint == "status":
        return

    auth_header = request.headers.get("Authorization")
    if not SERVER_API_TOKEN:
        return jsonify({"error": "SERVER_API_TOKEN not configured"}), 500

    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify({"error": "Missing or invalid Authorization header"}), 401

    token = auth_header.split(" ")[1]
    if token != SERVER_API_TOKEN:
        return jsonify({"error": "Invalid token"}), 401


@app.route("/")
def status():
    if not SERVER_API_TOKEN:
        return "Bitwarden Mxroute plugin is running, but SERVER_API_TOKEN is not configured."

    return "Bitwarden Mxroute plugin is running healthy."


@app.route("/add/<path:subpath>", methods=["POST"])
def add(subpath):
    data = request.get_json().get("domain")

    try:
        options = get_options(data.split(","))
        print(options)

        body = {
            "alias": options.get("alias"),
            "destinations": [options.get("destination")],
        }

        endpoint, headers = build_request(options.get("domain"))

        response = requests.post(endpoint, headers=headers, json=body)
        response.raise_for_status()

        return {"data": {"email": f"{options.get('alias')}@{options.get('domain')}"}}
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500
    except requests.exceptions.InvalidJSONError as e:
        return jsonify({"error": str(e)}), 412


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


@app.route("/delete/<email>", methods=["DELETE"])
def delete(email):
    try:
        alias, domain = email.split("@")
    except ValueError:
        return jsonify({"error": "Invalid email format."}), 400

    endpoint, headers = build_request(domain)

    try:
        response = requests.delete(f"{endpoint}/{alias}", headers=headers)
        response.raise_for_status()

        return jsonify({"message": "Deleted."}), response.status_code
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500
