#!/bin/bash

# --- Configuration ---
OUTPUT_FILE="code_context_$(date +%Y%m%d).txt"
MAX_SIZE_MB=1
# Convert MB to Bytes
MAX_SIZE_BYTES=$((MAX_SIZE_MB * 1024 * 1024))

# Specify file extensions to INCLUDE
# Focus on common JS/TS and Python source files
INCLUDE_EXTENSIONS=(
    js jsx ts tsx mjs cjs # JavaScript/TypeScript
    py                    # Python
    json                  # JSON (often config, use caution)
    # Add other relevant source types if needed: html css yml yaml toml ...
)

# Specify exact filenames to EXCLUDE
# These are often large or generated
EXCLUDE_FILES=(
    package-lock.json
    yarn.lock
    pnpm-lock.yaml
    poetry.lock
    Pipfile.lock
    # Add package.json if you specifically want to exclude it (can be large in monorepos)
    # 'package.json'
    # pyproject.toml (can usually be kept, small)
    pyvenv.cfg
    # Specific large data/config files if known
    # 'large_data_file.json'
)

# Specify filename PATTERNS to EXCLUDE (uses bash extended globbing)
# Helps exclude minified files, test files, etc.
EXCLUDE_PATTERNS=(
    # Minified files
    *.min.js *.min.css
    # Test files (common patterns)
    *test.* *spec.*
    # Storybook files
    *.stories.*
    # Common build/dist output patterns not caught by .gitignore
    # Add more specific patterns if needed
)

# Exclude root dotfiles (like .env, .gitignore, .bashrc etc.)
EXCLUDE_ROOT_DOTFILES=true # Set to false to include root dotfiles

# Estimate average header size per file to be safe
HEADER_BUFFER_PER_FILE=100
# --- End Configuration ---

echo "Starting repository content aggregation..."
echo "Output File: $OUTPUT_FILE"
echo "Size Limit: ${MAX_SIZE_MB}MB (${MAX_SIZE_BYTES} Bytes)"
echo "Including Extensions: ${INCLUDE_EXTENSIONS[*]}"
echo "Excluding Files: ${EXCLUDE_FILES[*]}"
echo "Excluding Patterns: ${EXCLUDE_PATTERNS[*]}"
echo "Excluding Root Dotfiles: $EXCLUDE_ROOT_DOTFILES"

# Enable extglob for pattern matching like !(pattern) if needed later,
# but simple regex/string matching is used for now.
# shopt -s extglob

# Clear the output file if it exists
> "$OUTPUT_FILE"
current_size=0
files_processed=0
files_skipped_extension=0
files_skipped_exclusion=0
files_skipped_size=0

# --- Build Regex/Patterns ---

# Inclusion regex (ends with specified extension)
include_pattern=$(printf "\\.%s$|" "${INCLUDE_EXTENSIONS[@]}")
include_pattern="(${include_pattern%|})" # -> (\.js$|\.py$|...)

# Exclusion arrays for easier lookup
declare -A exclude_files_map
for f in "${EXCLUDE_FILES[@]}"; do exclude_files_map["$f"]=1; done

# --- Process Files ---

# Use git ls-files -z for null-separated, robust filename handling
# Pipe to while loop for processing
git ls-files -z | while IFS= read -r -d $'\0' file; do

    # --- Filtering ---

    # 1. Check if file extension is included
    if ! [[ "$file" =~ $include_pattern ]]; then
        # echo "  Skipping (extension): $file" >&2
        ((files_skipped_extension++))
        continue
    fi

    # 2. Check for root dotfile exclusion
    if [[ "$EXCLUDE_ROOT_DOTFILES" == true && "$file" =~ ^\.[^/]+$ ]]; then
         echo "  Skipping (root dotfile): $file" >&2
         ((files_skipped_exclusion++))
         continue
    fi

    # 3. Check against exact excluded filenames
    filename_only=$(basename "$file")
    if [[ -v exclude_files_map["$filename_only"] ]]; then
        echo "  Skipping (exact filename): $file" >&2
        ((files_skipped_exclusion++))
        continue
    fi

    # 4. Check against excluded patterns
    skip_pattern=false
    for pattern in "${EXCLUDE_PATTERNS[@]}"; do
        if [[ "$file" == $pattern ]]; then # Use bash glob matching '=='
            echo "  Skipping (pattern match '$pattern'): $file" >&2
            skip_pattern=true
            break
        fi
    done
    if [[ "$skip_pattern" == true ]]; then
        ((files_skipped_exclusion++))
        continue
    fi

    # --- Size Check ---
    # Get size of the current file
    set +e # Prevent script exit if stat fails (e.g., file disappears)
    file_size=$(stat -c%s "$file" 2>/dev/null)
    set -e
    if [[ -z "$file_size" ]]; then
      echo "  Skipping (could not get size): $file" >&2
      continue # Skip if size couldn't be determined
    fi

    # Estimate size after adding this file (current + new file + header buffer)
    estimated_size=$((current_size + file_size + HEADER_BUFFER_PER_FILE))

    if [[ "$estimated_size" -gt "$MAX_SIZE_BYTES" ]]; then
        echo "  Skipping (size limit would be exceeded): $file (File Size: $file_size, Current Total: $current_size)" >&2
        ((files_skipped_size++))
        # Since git ls-files doesn't guarantee order, we might skip a small file
        # after skipping large ones. We continue checking others instead of breaking immediately.
        continue
        # If you prefer to stop immediately once the limit is hit, uncomment the next line:
        # break
    fi

    # --- Append to Output ---
    echo "  Processing: $file (Size: $file_size)" >&2
    {
      echo "--- File: $file ---"
      # Add error handling for cat
      cat "$file" || echo "*** Error reading file: $file ***" >&2
      echo "" # Add a newline for separation
    } >> "$OUTPUT_FILE"
    ((files_processed++))

    # Update current size accurately after appending
    current_size=$(stat -c%s "$OUTPUT_FILE" 2>/dev/null || echo $current_size)

done

# Check if loop was broken by size limit explicitly (only relevant if 'break' is used)
# if [[ "$estimated_size" -gt "$MAX_SIZE_BYTES" ]]; then
#    echo ""
#    echo "Stopped processing files because size limit (${MAX_SIZE_MB}MB) would be exceeded."
# fi

echo "--------------------------------------------------"
echo "Aggregation complete."
echo "  Files Processed: $files_processed"
echo "  Files Skipped (Wrong Extension): $files_skipped_extension"
echo "  Files Skipped (Excluded Name/Pattern/Dotfile): $files_skipped_exclusion"
echo "  Files Skipped (Size Limit): $files_skipped_size"
echo "Final Output File: $OUTPUT_FILE"
echo "Final Size: $(stat -c%s "$OUTPUT_FILE" 2>/dev/null || echo 0) Bytes"
echo "--------------------------------------------------"
echo "Please review '$OUTPUT_FILE'."
