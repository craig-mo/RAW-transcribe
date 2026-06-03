' RAW Transcribe — launcher
' Starts the Node server with no visible window, then opens the app in your
' default browser. Double-clickable; or use the desktop shortcut / taskbar pin
' created by setup.ps1.
'
' If the server is already running, this instance simply fails to bind port
' 3000 and exits silently — the browser still opens to the running server.

Set sh  = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

appDir = fso.GetParentFolderName(WScript.ScriptFullName)
sh.CurrentDirectory = appDir

' --- Future-proofing note -------------------------------------------------
' If you later add a package.json with npm dependencies, uncomment the next
' two lines so deps are installed on first launch:
' If fso.FileExists(appDir & "\package.json") And Not fso.FolderExists(appDir & "\node_modules") Then
'   sh.Run "cmd /c npm install", 0, True
' End If
' --------------------------------------------------------------------------

' Start the server hidden (0 = no window), don't wait for it to exit.
sh.Run "node server.js", 0, False

' Give the server a moment to bind the port.
WScript.Sleep 1200

' Open the app in the default browser.
sh.Run "explorer.exe ""http://localhost:3000""", 1, False
