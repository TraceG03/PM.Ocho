@echo off
echo Creating .env file...
(
echo VITE_SUPABASE_URL=https://qsocvmsfedmdnsjgsoyg.supabase.co
echo VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzb2N2bXNmZWRtZG5zamdzb3lnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDM1MjQxNiwiZXhwIjoyMDc5OTI4NDE2fQ.-LWBhh5_h2MwG6Z7aWo1XTFkoWlwg-ejYTuJqaSJBzU
) > .env

echo.
echo Installing dependencies...
call npm install

echo.
echo Starting dev server...
call npm run dev

