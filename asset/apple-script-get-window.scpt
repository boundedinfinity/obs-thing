tell application "System Events"
	tell process "Code"
		log (get bundle identifier)
		tell window ".editorconfig — blog"
			log (get size)
			log (get position)
		end tell
	end tell
end tell


tell application "System Events" get window ".editorconfig — blog" of process "Code" 
end tell
	