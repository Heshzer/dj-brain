import subprocess
import sys
import os

schema_path = r"C:\Users\PC\EasyPeazy\dj-brain\backend\src\database\schema.sql"

# Read schema
with open(schema_path, "r", encoding="utf-8") as f:
    schema_sql = f.read()

# Write it to a temp bat-style approach using psql stdin
psql_path = r"C:\Program Files\PostgreSQL\16\bin\psql.exe"
env = os.environ.copy()
env["PGPASSWORD"] = "postgres"

result = subprocess.run(
    [psql_path, "-U", "postgres", "-d", "djbrain"],
    input=schema_sql,
    capture_output=True,
    text=True,
    env=env,
    encoding="utf-8"
)

print("STDOUT:", result.stdout)
print("STDERR:", result.stderr)
print("Return code:", result.returncode)
