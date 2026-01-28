# MXRoute Bitwarden Alias Plugin

![Docker Image Version (latest semver)](https://img.shields.io/github/v/tag/bfpimentel/bitwarden-mxroute?label=latest&logo=github&style=flat-square)
![GitHub last commit](https://img.shields.io/github/last-commit/bfpimentel/bitwarden-mxroute?logo=github&style=flat-square)

A Bitwarden plugin (via "Addy.io" integration) for MXRoute.

This service mimics the Addy.io API to allow Bitwarden to generate email aliases directly on your MXRoute domains. It uses `coolname` for human-readable aliases.

## ⚠️ Disclaimer

Although there's authentication to the app, diligence is needed when exposing this utility to the public.

I'm not responsible for any compromised data.

## Installation

### Environment Variables
1. Configure the environment variables in a `.env` file or use them directly inside your `docker-compose.yml`:
   ```bash
   SERVER_API_TOKEN=your_secure_token_here

   MXROUTE_SERVER=<your_server>.mxrouting.net
   MXROUTE_USERNAME=<control_pane_username>
   MXROUTE_API_KEY=<control_pane_api_key>

   DEBUG=false # Optional for debugging the server

   SERVER_ADDRESS=http://bitwarden-mxroute-server:6123 # Optional for web app
   ```

### Docker (recommended)

1. Grab the example docker-compose file from [here](./docker-compose.yml).
2. Start the service:
   ```bash
   docker-compose up -d
   ```

The application will be running on `http://localhost:6123` by default.

### Manual

1. Clone the repo
2. Navigate to the `server` directory:
   ```bash
   cd server
   ```
3. Install python dependencies, e.g.:
   ```bash
   uv venv
   uv pip install -r requirements.txt
   source .venv/bin/activate
   ```
4. Run the server
   ```bash
   flask run --app app.py --host=0.0.0.0 --port=6123

   # Or, when debugging
   flask run --app app.py --host=0.0.0.0 --port=6123 --debug 
   ```

## How to use

Configure Bitwarden's "Generator" Tab:

1. Type: Forwarded email alias
2. Service: Addy.io
3. Email domain:
    1. Since we are "hacking" the Addy.io API spec for this plugin to work, all the customization is done through this field. The Web UI has an options configurator for ease of use, although optional.
    2. Refer to the **Available Options** section below.
4. **API Key:** Use the value of `SERVER_API_TOKEN`.
5. **Self-host server URL:** `http://<server_address>:6123/add`
6. Click the **"Generate email"** icon.

### Available Options

Configure these in the "Email domain" field using `key=value` format, separated by commas.

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `domain` | String | yes | None | The domain to create the alias on. |
| `destination` | String | yes | None | The destination email address. |
| `template` | String | no | `<slug>` | Format template. Allowed: `<slug>`, `<hex>`. |
| `prefix` | String | no | None | Prefix added to the alias. |
| `suffix` | String | no | None | Suffix added to the alias. |
| `hex_length` | Number | no | 6 | Length of the random hex string. |
| `slug_length` | Number | no | 2 | Number of words in the slug. |
| `slug_separator` | String | no | _ | Separator between slug words. |
| `alias_separator` | String | no | _ | Separator between alias components. |

**Example Input:**
`domain=test.com,destination=hello@test.com,prefix=foo,template=<slug><hex>,alias_separator=-`

**Result:** `foo-good_morning-8ed379@test.com`

> **Note:** If you encounter issues, try clearing the extension cache.

## Web App & API

This project includes a web interface for managing aliases and an API for direct access.

- **Web App:** `http://localhost:6124` (default)
- **API Status:** `GET /`
- **List Aliases:** `GET /list/<domain>`
- **Add Alias:** `POST /add`
- **Delete Alias:** `DELETE /delete/<alias_email>`
