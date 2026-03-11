{
  description = "bitwarden-mxroute development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
  };

  outputs = { self, nixpkgs }:
    let
      supportedSystems = [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ];
      forEachSupportedSystem = f: nixpkgs.lib.genAttrs supportedSystems (system: f {
        pkgs = import nixpkgs { inherit system; };
      });
    in
    {
      devShells = forEachSupportedSystem ({ pkgs }: {
        default = pkgs.mkShell {
          packages = with pkgs; [
            bun
            uv
            process-compose
          ];

          shellHook = /* bash */ ''
            export PC_PORT_NUM=10001
            export FLASK_APP=app.py

            cd server

            if [ ! -d ".venv" ]; then
              uv venv
            fi

            source .venv/bin/activate
            uv pip install -r pyproject.toml

            cd ../web
            bun install

            cd ..

            echo ""
            echo "================================================="
            echo "Bitwarden-MXroute development environment loaded!"
            echo "To start all services, run: process-compose up"
            echo "================================================="
            echo ""
          '';
        };
      });
    };
}
