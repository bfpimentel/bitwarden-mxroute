import requests

from flask import jsonify
from providers.provider import Provider


class MXRouteProvider(Provider):
    def __init__(self, server, username, api_key):
        self.server = server
        self.username = username
        self.api_key = api_key

    def add(self, domain, destination, alias):
        try:
            body = {
                "alias": alias,
                "destinations": [destination],
            }

            endpoint, headers = self._build_request(domain)

            response = requests.post(endpoint, headers=headers, json=body)
            response.raise_for_status()

            return {"data": {"email": f"{alias}@{domain}"}}
        except ValueError as e:
            return jsonify({"error": str(e)}), 412
        except requests.exceptions.RequestException as e:
            return jsonify({"error": str(e)}), 500

    def get(self, domain):
        endpoint, headers = self._build_request(domain)

        try:
            response = requests.get(endpoint, headers=headers)
            response.raise_for_status()

            data = response.json()

            return jsonify(data["data"]), response.status_code
        except requests.exceptions.RequestException as e:
            return jsonify({"error": str(e)}), 500

    def delete(self, email):
        try:
            alias, domain = email.split("@")
        except ValueError:
            return jsonify({"error": "Invalid email format."}), 400

        endpoint, headers = self._build_request(domain)

        try:
            response = requests.delete(f"{endpoint}/{alias}", headers=headers)
            response.raise_for_status()

            return jsonify({"message": "Deleted."}), response.status_code
        except requests.exceptions.RequestException as e:
            return jsonify({"error": str(e)}), 500

    def _build_request(self, domain):
        endpoint = f"https://api.mxroute.com/domains/{domain}/forwarders"
        headers = {
            "X-Server": self.server,
            "X-Username": self.username,
            "X-API-Key": self.api_key,
            "Content-Type": "application/json",
        }

        return endpoint, headers
