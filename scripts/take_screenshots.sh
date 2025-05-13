#!/bin/bash

# set the internal field separator to a newline character to handle spaces in filenames correctly
IFS=$'\n'
# get the current directory; Use argument 1 as the target directory (relative path)
TARGET_DIR=$(realpath "$1")

# Check if the target directory exists
if [ ! -d "$TARGET_DIR" ]; then
  echo "The target directory does not exist: $TARGET_DIR"
  exit 1
fi

# Optional argument 2: 'overwrite' to force overwrite existing screenshots
OVERWRITE=false
if [ "$2" == "overwrite" ]; then
  OVERWRITE=true
fi

function take_screenshot() {
  local file="$1"
  if [ -f "$file" ]; then
    glb_dirname=$(dirname "$file")
    glb_filename=$(basename "$file")


    png_file="$glb_dirname/$(basename "$glb_filename" .glb).png"
    if [ "$OVERWRITE" = true ] || [ ! -f "$png_file" ] || [ "$file" -nt "$png_file" ]; then
      if [[ "$OSTYPE" == "win32" ]]  ||  [[ "$OSTYPE" == "msys" ]]; then
      #Note: orientation=0 0 -2.4 is only good for VRM0; VRM1 might need a different orientation
          if node node_modules/@shopify/screenshot-glb/dist/cli.js -i "$file" -w 256 -h 256 -m "orientation=0 0 0.65" -o "$png_file"; then
              echo "Screenshot of $glb_filename saved as $(basename "$glb_filename" .glb).png"
          else
              echo "Failed to take a screenshot of $glb_filename"
          fi
      else
          if node ./node_modules/.bin/screenshot-glb -i "$file" -w 256 -h 256 -m "orientation=0 0 0.65" -o "$png_file"; then
              echo "Screenshot of $glb_filename saved as $(basename "$glb_filename" .glb).png"
          else
              echo "Failed to take a screenshot of $glb_filename"
          fi
      fi
    fi
  else
    echo "File not found: $file"
  fi
}

# Function to recursively find GLB files
find_glb_files() {
  local dir="$1"
  local glb_files=()
  
  # Find all GLB files recursively in the directory
  while IFS= read -r file; do
    glb_files+=("$file")
  done < <(find "$dir" -type f -name "*.glb")
  
  echo "Total GLB files found: ${#glb_files[@]}"
  
  # Process each GLB file
  for file in "${glb_files[@]}"; do
    echo "Taking screenshots of GLB: $file"
    take_screenshot "$file"
  done
}


# Main script
process_directory() {
  local target_dir="$1"
  
  # Check if the target directory exists
  if [ ! -d "$target_dir" ]; then
    echo "Error: '$target_dir' is not a directory."
    exit 1
  fi
  
  echo "Processing directory: $target_dir"
  
  # If looking at root, process each category directory
  for folder in "$target_dir"/*; do
    if [ -d "$folder" ]; then
      category=$(basename "$folder")
      echo "Processing category: $category"
      find_glb_files "$folder"
    fi
    if [ -f "$folder" ]; then
      # If it's a file, check if it's a GLB file and process it
      if [[ "$folder" == *.glb ]]; then
        echo "Taking screenshots of GLB: $folder"
        take_screenshot "$folder"
      fi
    fi
  done
}

process_directory "${1:-.}"

# Reset the internal field separator to the default value
unset IFS
