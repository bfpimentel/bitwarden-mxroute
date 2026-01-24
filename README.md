# MXRoute Bitwarden Alias Plugin

This project intends to be a Bitwarden plugin specific to MXRoute API. 

It works by creating a "fake" Addy.io server and route the calls to MXRoute.

Under the hood, it uses `coolname` to create the aliases.

While it's working as intended, consider it as a preview, since the following is planned:
1. API Key authentication
2. UI for listing and deleting aliases

This could be adapted to pretty much any email server that has an API. It might be configurable in the future, but it's not planned.

## ⚠️ Disclaimer

This should be used only locally. There's no authentication built-in and exposing it will result on exposing the MXRoute API indirectly.

## Installation

### Docker (recommended)

1. Navigate to the `docker` directory:
   ```bash
   cd docker
   ```
2. Configure the environment variables in `docker-compose.yml` or create a `.env` file:
   ```bash
   MXROUTE_SERVER=<your_server>.mxrouting.net
   MXROUTE_USERNAME=<control_pane_username>
   MXROUTE_API_KEY=<control_pane_api_key>
   ```
3. Start the service:
   ```bash
   docker-compose up -d
   ```
   The application will be running on `http://127.0.0.1:6123`.

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
4. Create a .env file with the following variables:
   ```bash
   # Your email server, e.g. pixel.mxrouting.net
   MXROUTE_SERVER=<your_server>.mxrouting.net
   # Your control pane username
   MXROUTE_USERNAME=<control_pane_username>
   # Panel API key, can be found in https://panel.mxroute.com/api-keys.php
   MXROUTE_API_KEY=<control_pane_api_key>
   ```
5. Run the server
   ```bash
   flask run --app app.py --host=0.0.0.0 --port=6123

   # Or, when debugging
   flask run --app app.py --host=0.0.0.0 --port=6123 --debug 
   ```

## How to use

Configure Bitwarden's "Generator" Tab:

1. Type: Forwarded email alias
2. Service: Addy.io
3. Email domain: The domain aliases will be created with. It doesn't need to be the same as the `<alias_destination_email>` found in step 5.5.
4. API Key: Anything - ignored
5. Self-host server URL: 
        1. e.g. `http://127.0.0.1:6123/add/<alias_destination_email>` (if host or port is kept at the defaults).
        2. Replace `<alias_destination_email>` with the email you want to redirect your alias **to**.
6. Click the "Generate email" icon.

Note: Sometimes cache can be an issue with extensions or the server. Remember to clean them if something goes wrong.

## Utilities

1. Status check
    - `https://127.0.0.1:6123`
2. List aliases for given domain
    - `https://127.0.0.1:6123/list/<alias_destination_email>`
