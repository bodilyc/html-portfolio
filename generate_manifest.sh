#!/bin/bash
# Generates FamilyImages/manifest.json from the subfolder structure.
# Run this script from the project root after adding/removing family folders or images.

FAMILY_DIR="FamilyImages"
OUTPUT="$FAMILY_DIR/manifest.json"

echo "{" > "$OUTPUT"

first_family=true
for family in "$FAMILY_DIR"/*/; do
    # Skip if no subdirectories found
    [ -d "$family" ] || continue

    family_name=$(basename "$family")

    # Skip hidden directories
    [[ "$family_name" == .* ]] && continue

    if [ "$first_family" = true ]; then
        first_family=false
    else
        echo "," >> "$OUTPUT"
    fi

    printf '  "%s": [' "$family_name" >> "$OUTPUT"

    first_file=true
    for img in "$family"*.{jpg,jpeg,png,gif,webp}; do
        [ -f "$img" ] || continue
        filename=$(basename "$img")

        if [ "$first_file" = true ]; then
            first_file=false
            echo "" >> "$OUTPUT"
        else
            echo "," >> "$OUTPUT"
        fi

        printf '    "%s"' "$filename" >> "$OUTPUT"
    done

    echo "" >> "$OUTPUT"
    printf '  ]' >> "$OUTPUT"
done

echo "" >> "$OUTPUT"
echo "}" >> "$OUTPUT"

echo "✅ Manifest generated: $OUTPUT"
