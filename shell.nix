let pkgs = import <nixpkgs> {};

in pkgs.mkShell rec {
  name = "node-dev";

  buildInputs = with pkgs; [
    nodejs_22
    rustup
    wabt
  ];
}
