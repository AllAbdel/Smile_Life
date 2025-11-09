Set WshShell = CreateObject("WScript.Shell")

' Obtenir le répertoire du script
Set fso = CreateObject("Scripting.FileSystemObject")
scriptPath = fso.GetParentFolderName(WScript.ScriptFullName)

' Créer un fichier de log
logFile = scriptPath & "\smile-life.log"
Set logStream = fso.CreateTextFile(logFile, True)
logStream.WriteLine "=== Smile Life - Demarrage ==="
logStream.WriteLine Now
logStream.Close

' Lancer le backend en arrière-plan
WshShell.Run "cmd /c cd /d """ & scriptPath & "\backend"" && node server.js > """ & scriptPath & "\backend.log"" 2>&1", 0, False

' Attendre 3 secondes
WScript.Sleep 3000

' Lancer le frontend en arrière-plan
WshShell.Run "cmd /c cd /d """ & scriptPath & "\frontend"" && npm start > """ & scriptPath & "\frontend.log"" 2>&1", 0, False

' Attendre 5 secondes puis ouvrir le navigateur
WScript.Sleep 5000
WshShell.Run "http://localhost:3000", 1, False

' Afficher un message
MsgBox "Lancement de Smile Life !" & vbCrLf & vbCrLf & "Le jeu est ouvert dans votre navigateur." & vbCrLf & vbCrLf & "Pour arreter le serveur, utilisez stop.bat", 64, "Smile Life"

Set WshShell = Nothing
Set fso = Nothing
