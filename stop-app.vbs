' RAW Transcribe — stopper
' Cleanly stops only the background server listening on port 3000.
' (Does NOT kill other Node processes you may have running.)

Set sh = CreateObject("WScript.Shell")

cmd = "powershell -NoProfile -WindowStyle Hidden -Command " & _
  """Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue " & _
  "| Select-Object -ExpandProperty OwningProcess -Unique " & _
  "| ForEach-Object { Stop-Process -Id $_ -Force }"""

sh.Run cmd, 0, True
