# VHS tape for the README CLI demo GIF.
# Render with:  vhs docs/cli-demo.tape   (run from the repo root)
# Keyless: uses the built-in `mock` provider, so it's fully reproducible.

Output docs/cli-demo.gif

Set Shell "bash"
Set FontSize 18
Set Width 1160
Set Height 840
Set Padding 28
Set TypingSpeed 45ms
Set Theme { "background": "#17141f", "foreground": "#e9e6f5", "cursor": "#a855f7", "selection": "#6d28d9", "black": "#1e1b2e", "red": "#fb7185", "green": "#34d399", "yellow": "#fbbf24", "blue": "#818cf8", "magenta": "#a855f7", "cyan": "#67e8f9", "white": "#e9e6f5", "brightBlack": "#8b86a8", "brightRed": "#fb7185", "brightGreen": "#34d399", "brightYellow": "#fbbf24", "brightBlue": "#818cf8", "brightMagenta": "#c4b5fd", "brightCyan": "#67e8f9", "brightWhite": "#ffffff" }

Hide
Type "export PATH=$PWD/node_modules/.bin:$PATH && clear" Enter
Show

Sleep 600ms
Type "promptopus run suites/quickstart.yaml"
Sleep 700ms
Enter
Sleep 4500ms
Sleep 2s
