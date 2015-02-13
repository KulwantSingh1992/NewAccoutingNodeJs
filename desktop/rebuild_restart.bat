Taskkill /F /IM nw.exe
sleep 2
rmdir /s /q release
call build.bat 
"release\nw.exe"
