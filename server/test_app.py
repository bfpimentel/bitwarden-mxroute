import pytest
import sys
import os
from unittest.mock import patch

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app


@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


@pytest.fixture
def headers():
    return {"Authorization": "Bearer test-token", "Content-Type": "application/json"}


@patch("app.SERVER_API_TOKEN", "test-token")
@patch("app.MXROUTE_SERVER", "mx.example.com")
@patch("app.MXROUTE_USERNAME", "user")
@patch("app.MXROUTE_API_KEY", "key")
class TestApp:
    def test_auth_missing_token(self, client):
        res = client.get("/")
        assert res.status_code == 401
        assert "Missing or invalid Authorization header" in res.json["error"]

    def test_auth_invalid_token(self, client):
        res = client.get("/", headers={"Authorization": "Bearer wrong"})
        assert res.status_code == 401
        assert "Invalid token" in res.json["error"]

    def test_options_no_auth(self, client):
        res = client.options("/")
        assert res.status_code == 200

    def test_status_success(self, client, headers):
        res = client.get("/", headers=headers)
        assert res.status_code == 200
        assert b"Bitwarden Mxroute plugin is running healthy" in res.data

    @patch("app.requests.post")
    @patch("app.coolname.generate")
    def test_add_success_default(self, mock_coolname, mock_post, client, headers):
        mock_coolname.return_value = ["cool", "slug"]
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = {}

        data = {"domain": "domain=example.com,destination=dest@example.com"}
        res = client.post("/add/dummy", headers=headers, json=data)

        assert res.status_code == 200
        assert res.json["data"]["email"] == "cool_slug@example.com"

        mock_post.assert_called_once()
        args, kwargs = mock_post.call_args
        assert args[0] == "https://api.mxroute.com/domains/example.com/forwarders"
        assert kwargs["json"]["alias"] == "cool_slug"
        assert kwargs["json"]["destinations"] == ["dest@example.com"]

    @patch("app.requests.post")
    @patch("app.coolname.generate")
    @patch("app.secrets.token_hex")
    def test_add_success_template(
        self, mock_hex, mock_coolname, mock_post, client, headers
    ):
        mock_coolname.return_value = ["slug"]
        mock_hex.return_value = "abcdef"
        mock_post.return_value.status_code = 200

        data = {
            "domain": "domain=example.com,destination=dest@example.com,template=<slug>-<hex>,slug_length=1"
        }
        res = client.post("/add/dummy", headers=headers, json=data)

        assert res.status_code == 200
        assert res.json["data"]["email"] == "slug_abcdef@example.com"

    def test_add_missing_options(self, client, headers):
        data = {"domain": "prefix=foo"}  # Missing domain/destination
        res = client.post("/add/dummy", headers=headers, json=data)
        assert res.status_code == 412
        assert "options are required" in res.json["error"]

    def test_add_invalid_template(self, client, headers):
        data = {"domain": "domain=d,destination=d,template=<bad>"}
        res = client.post("/add/dummy", headers=headers, json=data)
        assert res.status_code == 412
        assert "Template part 'bad' is not allowed" in res.json["error"]

    @patch("app.requests.get")
    def test_list_success(self, mock_get, client, headers):
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = {"data": [{"alias": "foo"}]}

        res = client.get("/list/example.com", headers=headers)
        assert res.status_code == 200
        assert res.json == [{"alias": "foo"}]

    @patch("app.requests.delete")
    def test_delete_success(self, mock_delete, client, headers):
        mock_delete.return_value.status_code = 204

        res = client.delete("/delete/foo@example.com", headers=headers)
        assert res.status_code == 204

    def test_delete_invalid_email(self, client, headers):
        res = client.delete("/delete/invalid-email", headers=headers)
        assert res.status_code == 400
