{ pkgs ? import <nixpkgs> {
    config = {
      allowUnfree = true;
      allowBroken = true;
      permittedInsecurePackages = [
        # Add any specific insecure packages if needed
      ];
    };
  }
}:

let
  x = 10;
in
pkgs.mkShell {
  buildInputs = with pkgs; [
    # ... (previous buildInputs remain the same) ...

    # Python environment
    python312
    python312Packages.pip
    python312Packages.setuptools
    python312Packages.wheel
    python312Packages.virtualenv
    python312Packages.packaging # Keep this, aider-chat dependency
    uv
    python312Packages.conda
    poetry

    # ... (other buildInputs sections) ...

    # X11 and related libraries
    xorg.libX11
    xorg.libXcomposite
    xorg.libXcursor
    xorg.libXdamage
    xorg.libXext
    xorg.libXi
    xorg.libXrandr
    xorg.libXScrnSaver
    xorg.libXtst
    xorg.libxcb
    xorg.libXfixes
    xorg.libXrender # <---- Added XRender
    xorg.libXt # <---- Added Xt

    # GTK and related libraries
    pango
    cairo
    cups.lib
    dbus
    expat
    fontconfig
    freetype
    libpng
    nspr
    nss
    atk
    gdk-pixbuf
    gtk3
    alsa-lib
    gvfs

    # Additional missing libraries
    glib
    at-spi2-atk
    at-spi2-core
    libxkbcommon
    udev
    mesa # Provides OpenGL implementations
    mesa.drivers # Specific drivers
    libdrm # Direct Rendering Manager
    libGL # Core OpenGL library symlink
    libglvnd # GL Vendor-Neutral Dispatch library

    # ... (rest of buildInputs) ...

    # Add these dependencies (check for duplicates)
    stdenv.cc.cc.lib
    # libGL already listed above
  ];

  shellHook = ''
    # Allow unfree packages
    export NIX_ALLOW_UNFREE=1

    # Explicitly prefer Mesa GL libraries
    export __GLX_VENDOR_LIBRARY_NAME=mesa

    # THIS FIRST LD_LIBRARY_PATH IS LIKELY REDUNDANT due to the makeLibraryPath below,
    # but keeping it in case it was added for a specific reason.
    export LD_LIBRARY_PATH=${pkgs.stdenv.cc.cc.lib}/lib:$LD_LIBRARY_PATH

    # ... (docker, python, rust, go setup logic) ...

    export npm_config_prefix=$HOME/.npm-global
    mkdir -p $HOME/.npm-global/bin
    export PATH=$HOME/.npm-global/bin:$PATH

    export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1
    export PUPPETEER_EXECUTABLE_PATH=${pkgs.chromium}/bin/chromium

    # Add necessary libraries for graphical applications like Electron to LD_LIBRARY_PATH
    export LD_LIBRARY_PATH=${pkgs.lib.makeLibraryPath [
      pkgs.glib
      pkgs.nss
      pkgs.nspr
      pkgs.dbus
      pkgs.atk
      pkgs.at-spi2-atk
      pkgs.cups.lib
      pkgs.expat
      pkgs.xorg.libX11
      pkgs.xorg.libXcomposite
      pkgs.xorg.libXcursor # Often needed with gtk3
      pkgs.xorg.libXdamage
      pkgs.xorg.libXext
      pkgs.xorg.libXfixes
      pkgs.xorg.libXi # Input devices
      pkgs.xorg.libXrandr
      pkgs.xorg.libXrender # <---- Added XRender here
      pkgs.xorg.libXt # <---- Added Xt here
      pkgs.xorg.libXScrnSaver
      pkgs.xorg.libXtst # Testing/Accessibility
      pkgs.mesa # OpenGL implementation
      pkgs.libdrm # Graphics memory management
      pkgs.libGL # Core lib
      pkgs.libglvnd # GL Dispatch
      pkgs.xorg.libxcb
      pkgs.libxkbcommon
      pkgs.pango
      pkgs.cairo
      pkgs.gdk-pixbuf
      pkgs.gtk3
      pkgs.gvfs
      pkgs.udev
      pkgs.alsa-lib
      pkgs.at-spi2-core
      pkgs.stdenv.cc.cc.lib
    ]}:$LD_LIBRARY_PATH

    # ... (npm install checks, Node version checks) ...

    alias start-docker='sudo systemctl start docker.service'

    export CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_LINKER=lld

    export PATH="$HOME/.cargo/bin:$PATH:$PWD/scripts"
    export MANGEKYO_SERVER_URL="http://localhost:17891"

    # ... (gcloud, .env setup) ...

    echo "✨ Development environment ready with Scala, Go, and Rust support! ✨"

    echo ""
    echo "Running Claude doctor to check environment..."
    # ... (claude doctor logic) ...
  '';
}
