#!/bin/sh
# Ponto de entrada do container do backend.
#
# Plataformas como o Render entregam o banco numa única variável no formato
#   DATABASE_URL=postgresql://usuario:senha@host:porta/banco
# O driver JDBC não aceita esse formato: ele espera jdbc:postgresql://host:porta/banco,
# com usuário e senha à parte (DB_USER / DB_PASSWORD). Se só a DATABASE_URL vier,
# monta a DB_URL a partir dela. No docker compose a DB_URL já vem pronta e nada muda.
set -eu

if [ -n "${DATABASE_URL:-}" ] && [ -z "${DB_URL:-}" ]; then
  # "${DATABASE_URL#*@}" remove tudo até o @ (esquema, usuário e senha): sobra host:porta/banco.
  export DB_URL="jdbc:postgresql://${DATABASE_URL#*@}"
fi

exec java org.springframework.boot.loader.launch.JarLauncher "$@"
