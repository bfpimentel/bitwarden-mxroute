import secrets
import os
import re
import coolname
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
from typing import Dict

from providers.mxroute import MXRouteProvider
from providers.provider import Provider
from providers.purelymail import PurelymailProvider

load_dotenv()

app = Flask(__name__)
CORS(app)

SERVER_API_TOKEN = os.getenv("SERVER_API_TOKEN")

provider: Provider | None = None


def get_options(request_options) -> tuple[str, str, str]:
    options: Dict[str, str] = {}
    for option in request_options:
        if "=" in option:
            key, value = option.split("=", 1)
            options[key] = value

    domain = options.get("domain")
    destination = options.get("destination")

    if not domain or not destination:
        raise ValueError("The 'domain' and 'destination' options are required.")

    static = options.get("static")
    template = options.get("template", "<slug>")
    prefix = options.get("prefix", "")
    suffix = options.get("suffix", "")
    alias_separator = options.get("alias_separator", "_")
    slug_separator = options.get("slug_separator", "_")
    slug_length = int(options.get("slug_length", "2"))
    hex_length = int(options.get("hex_length", "6"))

    if static:
        return domain, destination, static

    template_parts = []
    for match in re.findall(r"<(.*?)>", template):
        template_parts.append(match)

    alias_parts = []
    for _, part in enumerate(template_parts):
        if part not in ["slug", "hex"]:
            raise ValueError(f"Template part '{part}' is not allowed.")

        match part:
            case "slug":
                if slug_length == 1:
                    alias_parts.append(coolname.generate(2)[0])
                else:
                    alias_parts.append(
                        slug_separator.join(coolname.generate(slug_length))
                    )
            case "hex":
                alias_parts.append(secrets.token_hex(hex_length)[:hex_length])

    alias = alias_separator.join(alias_parts)

    if prefix != "":
        alias = f"{prefix}{alias_separator}{alias}"
    if suffix != "":
        alias += f"{alias_separator}{suffix}"

    return domain, destination, alias


@app.before_request
def check_auth():
    if request.method == "OPTIONS":
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
    return "Bitwarden Alias Provider is running healthy."


@app.route("/add/<path:subpath>", methods=["POST"])
def add(subpath):
    data = request.get_json().get("domain")
    domain, destination, alias = get_options(data.split(","))
    return provider.add(domain, destination, alias)


@app.route("/list/<domain>", methods=["GET"])
def get(domain):
    return provider.get(domain)


@app.route("/delete/<email>", methods=["DELETE"])
def delete(email):
    return provider.delete(email)


if __name__ == "__main__":
    match os.getenv("ALIAS_PROVIDER"):
        case "mxroute":
            provider = MXRouteProvider(
                server=os.getenv("MXROUTE_SERVER"),
                username=os.getenv("MXROUTE_USERNAME"),
                api_key=os.getenv("MXROUTE_API_KEY"),
            )
        case "purelymail":
            provider = PurelymailProvider(
                api_key=os.getenv("PURELYMAIL_API_KEY"),
            )
        case _:
            raise ValueError(
                "ALIAS_PROVIDER should be set to one of the options: mxroute, purelymail"
            )

    app.run(host="0.0.0.0", port=7123, debug=True, threaded=True)
