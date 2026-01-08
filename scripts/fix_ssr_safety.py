import os
import re

def protect_ssr_calls(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Skip if already protected or not a client component (though we check for 'use client' below)
    if 'typeof window' in content:
        # We still might need to protect other calls, but let's be careful
        pass

    # Pattern for localStorage.getItem/setItem/removeItem
    ls_pattern = r'(localStorage\.(?:getItem|setItem|removeItem|clear)\([^)]*\))'
    
    def ls_replace(match):
        call = match.group(1)
        return f"(typeof window !== 'undefined' ? {call} : null)"

    # Pattern for window.location, window.open, window.confirm, etc.
    # We exclude 'typeof window' itself
    win_pattern = r'(?<!typeof )(window\.(?:location|open|confirm|alert|localStorage|sessionStorage|history|print|addEventListener|removeEventListener)[a-zA-Z.]*)'

    def win_replace(match):
        call = match.group(1)
        return f"(typeof window !== 'undefined' ? {call} : undefined)"

    new_content = re.sub(ls_pattern, ls_replace, content)
    new_content = re.sub(win_pattern, win_replace, new_content)

    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True
    return False

def main():
    root_dir = '.'
    extensions = ('.ts', '.tsx', '.js', '.jsx')
    count = 0
    for root, dirs, files in os.walk(root_dir):
        if '.git' in root or 'node_modules' in root:
            continue
        for file in files:
            if file.endswith(extensions):
                file_path = os.path.join(root, file)
                if protect_ssr_calls(file_path):
                    count += 1
    print(f"Protected {count} files against SSR errors.")

if __name__ == "__main__":
    main()
