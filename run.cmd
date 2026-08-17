@echo off
setlocal EnableExtensions
cd /d "%~dp0"

call :find_jdk
if not defined JAVA_HOME (
  echo.
  echo JDK 17+ 를 찾지 못했습니다.
  echo Temurin 17 설치: https://adoptium.net/
  echo 설치 후 터미널을 새로 열고 다시 실행하세요.
  echo Maven은 필요 없습니다. 이 스크립트가 javac 로 바로 실행합니다.
  exit /b 1
)

set "PATH=%JAVA_HOME%\bin;%PATH%"
echo Using JDK: %JAVA_HOME%
"%JAVA_HOME%\bin\java.exe" -version
echo.

"%JAVA_HOME%\bin\javac.exe" *.java
if errorlevel 1 (
  echo 컴파일에 실패했습니다.
  exit /b 1
)

echo 게임을 시작합니다.
"%JAVA_HOME%\bin\java.exe" TetrisMain
exit /b %ERRORLEVEL%

:find_jdk
if defined JAVA_HOME if exist "%JAVA_HOME%\bin\javac.exe" goto :eof

where javac >nul 2>&1
if not errorlevel 1 (
  for /f "delims=" %%i in ('where javac') do (
    for %%j in ("%%~dpi..") do set "JAVA_HOME=%%~fj"
    goto :eof
  )
)

if exist "%ProgramFiles%\Android\Android Studio\jbr\bin\javac.exe" (
  set "JAVA_HOME=%ProgramFiles%\Android\Android Studio\jbr"
  goto :eof
)
if exist "%ProgramFiles%\Microsoft\jdk-17*\bin\javac.exe" (
  for /d %%i in ("%ProgramFiles%\Microsoft\jdk-17*") do set "JAVA_HOME=%%i"
  goto :eof
)
if exist "%ProgramFiles%\Eclipse Adoptium\jdk-17*\bin\javac.exe" (
  for /d %%i in ("%ProgramFiles%\Eclipse Adoptium\jdk-17*") do set "JAVA_HOME=%%i"
  goto :eof
)
if exist "%ProgramFiles%\Java\jdk-17*\bin\javac.exe" (
  for /d %%i in ("%ProgramFiles%\Java\jdk-17*") do set "JAVA_HOME=%%i"
  goto :eof
)
goto :eof
