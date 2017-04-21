{config, pkgs, ...}:
let
  nodejs = pkgs.nodejs;
#   trollbox_package = {stdenv, nodejs, coreutils, R}:
#     stdenv.mkDerivation {
#       name = "trollbox_client-0.1";
#       src = /root/trollbox_client;
#       nodejs = nodejs;
#       coreutils = coreutils;
#       builder = builtins.toFile "builder.sh" ''
#         export PATH=$coreutils/bin
#         mkdir -p $out
#         cp -r $src/* $out/
#         cat >start.sh <<EOF
#         #!/bin/sh
#         $nodejs/bin/node ./index.js
#         EOF
#         chmod a+x start.sh
#         cp start.sh $out/
#       '';
#     };
#   trollbox_client = trollbox_package {
#     inherit (pkgs) stdenv R coreutils;
#     nodejs = pkgs."nodejs-7_x";
#   };
in
{
  imports = [ <nixpkgs/nixos/modules/virtualisation/amazon-image.nix> ];
  ec2.hvm = true;
  environment.systemPackages = [nodejs pkgs.git pkgs.yarn];

  users.extraUsers.trollbox_client =
  {
    isNormalUser = true;
    home = "/home/trollbox_client";
    description = "Trollbox client";
  };

  systemd.services.trollbox_client = {
    description = "Trollbox client";
    after = ["multi-user.target"];
    enable = true;
    serviceConfig = {
      ExecStart="${nodejs}/bin/node /home/trollbox_client/santiment/trollbox_backend/main.js";
      WorkingDirectory=/home/trollbox_client/santiment/trollbox_backend;  # Required on some systems
      Restart="always";
      RestartSec=10;                       # Restart service after 10 seconds if node service crashes
      StandardOutput="syslog";               # Output to syslog
      StandardError="syslog";                # Output to syslog
      SyslogIdentifier="trollbox-client";
      User="trollbox_client";
      #Group=<alternate group>
      Environment="NODE_ENV=production";
    };
  };
}
