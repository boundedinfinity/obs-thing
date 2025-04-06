tell application "System Events"
    repeat with _PROCESS in (application processes where background only is false)
        repeat with _WINDOW in every window of _PROCESS
            try
                log "-----------------------------"
                log displayed name of _PROCESS as string
                log bundle identifier of _PROCESS as string
                log name of the _WINDOW as string
                log (get size of _WINDOW)
                log (get position of _WINDOW)
            on error _ERRMSG
                log _ERRMSG
            end try
        end repeat
    end repeat
end tell
