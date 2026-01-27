# MXRoute Bitwarden Alias Plugin

This project intends to be a Bitwarden plugin specific to MXRoute API. 

It works by creating a "fake" Addy.io server and route the calls to MXRoute.

Under the hood, it uses `coolname` to create the aliases.

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
    1. Since we are "hacking" the Addy.io API spec for this plugin to work, all the customization is done through this field. I'll be implementing a tool in the Web UI for more ease of use.
    2. Available options (comma separated in the format `key=value`:
        - *domain* (required)
        - *destination* (required)
        - *prefix*: string, default: none
        - *suffix*: string, default: none
        - *slug_length*: number, default: 2 (recommended to be kept at most 3)
        - *slug_separator*: string, default: `_`
        - *hex_length* number, default: 6
        - *slug_separator*: string, default: `_` (in case you want to change how the words in the slug are separated)
        - *alias_separator*: string, default: `_` (in case you want to change how the components of the alias are separated)
        - *template*:
           - Templating for now just have 2 components: `<slug>` and `<hex>`. The `prefix` and `suffix` options are not allowed, for self-explanatory reasons.
               - `<slug>` is a human readable text, such as `great-grey-wolf`.
               - `<hex>` is a random hex number, such as `4fb21c`.
           - The format **needs** to contain the 'less-than' `(<)` and 'greater-than' `(>)` symbols. e.g. `<slug><hex>`
        - e.g.
            - User input: `domain=test.com,destination=hello@test.com,prefix=foo,suffix=bar,template=<slug><hex>,alias_separator=-`
            - Generated alias: `foo-good_morning-8ed379-bar@test.com`
4. API Key: The same that has been configured in the `SERVER_API_TOKEN` environment variable.
5. Self-host server URL: `http://<server_address>/add`
6. Click the "Generate email" icon.

Note: Sometimes cache can be an issue with extensions or the server. Remember to clean them if something goes wrong.

## Utilities

### Web App

This repo provides a simple web app for listing and deleting aliases. 

By default, it can be accessed through `http://localhost:6124`.

The default docker-compose files contain an example for running it.

It uses the server instead of directly interacting with MXRoute's API, so the server is a dependency, while the web app is just optional.

### API
- Status check
    - `http://<server_address>/`
- List aliases for given domain
    - `http://<server_address>/list/<domain>`
- Delete alias
    - `http://<server_address>/delete/<alias_email>`
