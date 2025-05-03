# AiderDesk Custom Setup Guide (Nix + DeepSeek + Patched Connector)

This guide explains the specific steps required to configure and run this modified version of AiderDesk, focusing on environment setup within a Nix shell.

## Key Customizations Covered:

1.  **Secure API Key Management:** Using a `.env` file for the `DEEPSEEK_API_KEY`.
2.  **Internal Python Environment Fixes:** Manually installing necessary Python packages into AiderDesk's managed virtual environment (`venv`) to overcome versioning/patch incompatibilities.

---

## Step 1: API Key Setup using `.env`

To securely manage your DeepSeek API key without hardcoding it into version-controlled files:

1.  **Navigate** to the root directory of your cloned `aider-desk` repository (e.g., `/home/h0ffmann/Code/aider-desk`).
2.  **Create** a file named `.env` if it doesn't exist:
    ```bash
    touch .env
    ```
3.  **Edit** the `.env` file and add your DeepSeek API key:
    ```dotenv
    # Contents of ./.env
    DEEPSEEK_API_KEY=your_actual_deepseek_api_key
    ```
    *(Replace `your_actual_deepseek_api_key` with your real secret key)*
4.  **Important:** Add `.env` to your project's `.gitignore` file to prevent accidentally committing your secret:
    ```gitignore
    # .gitignore
    .env
    *.env
    .env.*
    ```
5.  **Nix Integration:** The provided `/etc/nixos/dev-shell.nix` configuration includes a `shellHook` that automatically loads variables from this `.env` file when you enter the Nix shell *from the project's root directory*. This makes the `DEEPSEEK_API_KEY` available to the AiderDesk process.

---

## Step 2: Manual Python Dependency Installation for Internal Venv

AiderDesk uses an internal Python virtual environment located typically at `~/.config/aider-desk-dev/python-venv` to run the `aider-chat` tool. Due to modifications in this fork (like the `connector.py` patch) and specific version interactions within the Nix environment, AiderDesk's automatic setup may fail to install all necessary Python dependencies *inside* this internal venv correctly.

**Therefore, you MUST manually install these packages into the venv after the initial setup attempt.**

**When to Perform This:**

*   You only need to do this **once** after cloning the repository and running `npm run dev` for the first time (which creates the initial venv structure).
*   You also need to repeat this step if you ever manually **delete** the `~/.config/aider-desk-dev/python-venv` directory.

**Procedure:**

1.  **Enter the Nix Shell:** Make sure you are inside the Nix shell environment activated for your AiderDesk project.
    ```bash
    # Example: navigate to project root and run nix-shell
    cd /home/h0ffmann/Code/aider-desk
    nix-shell /etc/nixos/dev-shell.nix # Or your usual command
    ```
2.  **Run AiderDesk Once (to create venv):** If this is the very first run or you deleted the venv, start AiderDesk briefly. It will create the venv directory and likely fail when trying to run Aider commands.
    ```bash
    npm run dev
    ```
    *Wait for the logs showing setup steps. Stop the process (Ctrl+C) after the venv is created or when errors appear.*
3.  **Activate the Internal Venv:**
    ```bash
    source ~/.config/aider-desk-dev/python-venv/bin/activate
    ```
    *Your shell prompt should change, indicating you are inside the venv.*
4.  **Define Venv Site-Packages Path:** (Adjust `python3.12` if your Nix Python version is different)
    ```bash
    VENV_SITE_PACKAGES="$HOME/.config/aider-desk-dev/python-venv/lib/python3.12/site-packages"
    echo "Targeting directory: $VENV_SITE_PACKAGES"
    ```
5.  **Force-Install Required Packages:** Use `pip install --target` to install copies directly into the venv's `site-packages`, ignoring libraries potentially available only via Nix paths.
    ```bash
    # Install core missing dependencies
    echo "Installing packaging..."
    pip install --target="$VENV_SITE_PACKAGES" packaging
    echo "Installing distro..."
    pip install --target="$VENV_SITE_PACKAGES" distro

    # Install other commonly problematic dependencies if needed
    echo "Installing httpx..."
    pip install --target="$VENV_SITE_PACKAGES" httpx
    echo "Installing requests..."
    pip install --target="$VENV_SITE_PACKAGES" requests
    echo "Installing tqdm..."
    pip install --target="$VENV_SITE_PACKAGES" tqdm
    echo "Installing aiohttp..."
    pip install --target="$VENV_SITE_PACKAGES" aiohttp
    echo "Installing sniffio..."
    pip install --target="$VENV_SITE_PACKAGES" sniffio

    # Add more 'pip install --target...' lines here if you encounter other ModuleNotFoundErrors
    ```
    *Note: Ignore warnings about `pip's dependency resolver` during these installs.*
6.  **Deactivate the Venv:**
    ```bash
    deactivate
    ```

---

## Step 3: Running AiderDesk

After completing Steps 1 and 2:

1.  **Ensure you are in the Nix shell.**
2.  **Run the application:**
    ```bash
    npm run dev
    ```

AiderDesk should now launch correctly, using your DeepSeek API key from `.env` and finding the necessary Python packages (`packaging`, `distro`, etc.) within its internal venv.

---
