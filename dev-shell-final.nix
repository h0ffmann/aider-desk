# Final Consolidated Version: /etc/nixos/dev-shell.nix
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
  # You can define local variables here if needed, 'x' seems unused but kept for structure.
  x = 10;
in
pkgs.mkShell {
  # == List of all packages made available in the Nix shell ==
  buildInputs = with pkgs; [
    # --- Core Development Languages & Tools ---
    # Node.js (matches user's last successful environment)
    nodejs_22
    nodePackages.npm # Explicitly include npm
    yarn             # Include Yarn if used

    # Python (matches user's environment & aider-desk needs)
    python312
    python312Packages.pip
    python312Packages.setuptools
    python312Packages.wheel
    python312Packages.virtualenv
    # Dependencies aider-desk's internal venv will need during its setup
    python312Packages.packaging
    python312Packages.distro
    python312Packages.httpx
    python312Packages.requests
    python312Packages.tqdm
    python312Packages.aiohttp
    python312Packages.sniffio
    python312Packages.idna # Common dependency
    # Optional Python tools from original config
    uv
    python312Packages.conda
    poetry

    # Rust Environment
    rustc
    cargo
    rustfmt
    clippy
    rust-analyzer
    # WASM Support
    wasm-pack
    llvmPackages.lld

    # Go Environment
    go

    # Scala Environment
    scala-cli

    # --- Build & System Dependencies ---
    # C/C++ Build Tools & Libraries
    gcc # build-essential equivalent
    gnumake
    binutils
    pkg-config
    # Common Dev Libraries
    openssl
    openssl.dev # For headers/dev files
    libclang    # For code completion/analysis tools
    clang
    stdenv.cc.cc.lib # Standard C++ library paths

    # Postgres Dev Libraries
    postgresql
    postgresql.lib

    # --- Electron Runtime Dependencies ---
    # Graphics / OpenGL Stack (Crucial for Electron rendering)
    mesa         # Mesa implementation of OpenGL
    mesa.drivers # GPU-specific Mesa drivers
    libdrm       # Direct Rendering Manager (memory management)
    libGL        # libGL.so.1 symlink (often points to Mesa or libglvnd)
    libglvnd     # OpenGL Vendor-Neutral Dispatch (handles multiple GL drivers)
    # Xorg Libraries (Windowing System)
    xorg.libX11
    xorg.libXcomposite
    xorg.libXcursor
    xorg.libXdamage
    xorg.libXext
    xorg.libXfixes
    xorg.libXi # Input devices
    xorg.libXrandr # Screen resolution/multi-monitor
    xorg.libXrender # Rendering extension
    xorg.libXScrnSaver # Screensaver interaction
    xorg.libXt # X Toolkit Intrinsics
    xorg.libXtst # Testing/Accessibility extensions
    xorg.libxcb # X protocol C-language Binding

    # GTK and Desktop Integration Libraries
    glib # Low-level core library
    gtk3 # GTK+ 3 toolkit
    gdk-pixbuf # Image loading for GTK
    pango # Font rendering/layout
    cairo # 2D graphics library
    fontconfig # Font management
    freetype # Font rendering engine
    libpng # PNG image support
    gvfs # GNOME Virtual File System (for file dialogs, etc.)
    atk # Accessibility Toolkit
    at-spi2-atk # AT-SPI GTK+ module
    at-spi2-core # Assistive Technology Service Provider Interface core
    libxkbcommon # Keyboard handling

    # System Services / Utilities
    dbus # Inter-process communication
    udev # Device management
    nss # Network Security Services (Certificates, etc.)
    nspr # Netscape Portable Runtime (used by NSS)
    cups.lib # Printing support library
    alsa-lib # Audio backend library
    expat # XML parser

    # --- Container & Infra Tools ---
    # Docker
    docker
    docker-compose
    docker-client
    # Terraform
    terraform
    terraform-ls
    tflint
    terraform-docs
    terragrunt
    # Pulumi
    pulumi
    # Linting
    hadolint
    # Cloud SDKs
    google-cloud-sdk

    # --- Other Utilities ---
    # General Dev Tools
    git
    busybox
    lsof
    jq # JSON processor
    # Command Runner
    just
    # Supabase
    supabase-cli
    # Network Tools
    speedtest-cli
    dig # DNS lookup
    nmap
    # Browser Automation Deps
    chromium # Needed for Electron/Playwright/Puppeteer
    # File Watching
    inotify-tools # For Linux file system events
  ];

  # == Commands executed when entering the shell ==
  shellHook = ''
    # Allow installation/use of unfree packages defined in buildInputs
    export NIX_ALLOW_UNFREE=1

    # --- START: Load .env file from project root ---
    # Must run `nix-shell` from the project root for this to work
    if [ -f .env ]; then
      echo "Nix Hook: Loading environment variables from .env file..."
      set -a # Automatically export variables defined by 'source'
      source .env
      set +a # Disable auto-export
      echo "Nix Hook: .env file loaded."
    else
      echo "Nix Hook: No .env file found in current directory, skipping." >&2
      # Optional: Check if required keys are missing
      if [ -z "$DEEPSEEK_API_KEY" ]; then
        echo "Nix Hook: Warning: DEEPSEEK_API_KEY not set. Create './.env' or export manually." >&2
      fi
    fi
    # --- END: Load .env file ---

    # Explicitly tell OpenGL applications to prefer the Mesa implementation
    export __GLX_VENDOR_LIBRARY_NAME=mesa

    # --- Library Path Setup (Crucial for Electron / GUI apps in Nix) ---
    # Add standard C++ libs first (can be sometimes needed)
    export LD_LIBRARY_PATH=${pkgs.stdenv.cc.cc.lib}/lib${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}
    # Add all necessary graphical and system libraries
    export LD_LIBRARY_PATH=${pkgs.lib.makeLibraryPath [
      pkgs.glib pkgs.nss pkgs.nspr pkgs.dbus pkgs.atk pkgs.at-spi2-atk
      pkgs.cups.lib pkgs.expat pkgs.xorg.libX11 pkgs.xorg.libXcomposite
      pkgs.xorg.libXcursor pkgs.xorg.libXdamage pkgs.xorg.libXext pkgs.xorg.libXfixes
      pkgs.xorg.libXi pkgs.xorg.libXrandr pkgs.xorg.libXrender pkgs.xorg.libXt
      pkgs.xorg.libXScrnSaver pkgs.xorg.libXtst pkgs.mesa pkgs.libdrm pkgs.libGL
      pkgs.libglvnd pkgs.xorg.libxcb pkgs.libxkbcommon pkgs.pango pkgs.cairo
      pkgs.gdk-pixbuf pkgs.gtk3 pkgs.gvfs pkgs.udev pkgs.alsa-lib pkgs.at-spi2-core
      pkgs.fontconfig pkgs.freetype pkgs.libpng
    ]}${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH} # Prepend generated path to existing LD_LIBRARY_PATH

    # --- Tool Specific Environment Setup ---
    # NPM Global Path Configuration
    export npm_config_prefix=$HOME/.npm-global
    mkdir -p "$npm_config_prefix/bin"
    export PATH="$npm_config_prefix/bin${PATH:+:$PATH}"

    # Puppeteer Configuration (Prevent download, point to Nix Chromium)
    export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1
    export PUPPETEER_EXECUTABLE_PATH=${pkgs.chromium}/bin/chromium

    # Go Environment Setup
    # export GOPATH="$PWD/.go" # Using project-local Go path - uncomment if needed
    # export GOBIN="$GOPATH/bin"
    # export PATH="$GOBIN${PATH:+:$PATH}"
    # mkdir -p "$GOBIN"

    # Rust WASM Linker
    export CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_LINKER=lld

    # Custom PATH additions (Project scripts, Cargo bin)
    export PATH="$HOME/.cargo/bin${PATH:+:$PATH}"
    # export PATH="$PWD/scripts${PATH:+:$PATH}" # Add project scripts dir if exists

    # --- Informational Messages & Checks ---
    echo "----------------------------------------"
    echo "Nix Development Environment Activated"
    echo "----------------------------------------"
    echo "Node.js Version: $(node -v)"
    echo "NPM Version: $(npm -v)"
    # Node Version Check (optional)
    # NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
    # if [ "$NODE_VERSION" -lt "18" ]; then
    #  echo "Warning: Node.js v18+ recommended for some tools." >&2
    # fi

    # Check Docker (informational, no changes)
    # if command -v docker &>/dev/null; then ... (original docker check logic) ... fi

    # Check Python (informational)
    echo "Python Version: $(python --version)"
    # if command -v poetry &>/dev/null; then echo "Poetry Version: $(poetry --version)"; fi

    # Check Google Cloud SDK (informational)
    # if command -v gcloud &>/dev/null; then ... (original gcloud check logic) ... fi

    echo "LD_LIBRARY_PATH includes necessary graphics libraries."
    # Example API Key Check
    if [ -n "$DEEPSEEK_API_KEY" ]; then
        echo "DEEPSEEK_API_KEY is set."
    else
        echo "Warning: DEEPSEEK_API_KEY is NOT set." >&2
    fi
    echo "----------------------------------------"
    echo "Ready to start development!"
    echo "Run 'npm run dev' inside './Code/aider-desk'."
    echo "----------------------------------------"
  '';
}
