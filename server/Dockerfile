FROM python:3.12-slim

WORKDIR /app

COPY server/pyproject.toml /app/

RUN pip install --no-cache-dir .

COPY server /app

EXPOSE 6123

ENV FLASK_APP=app.py

CMD ["flask", "run", "--host=0.0.0.0", "--port=6123"]
