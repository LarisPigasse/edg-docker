#!/usr/bin/env bash
# comando.sh — prepara il comando per exec-in-container (che passa da cmd di Windows e poi da sh)
#   bash comando.sh <script.js> [VAR=valore ...] > cmd.txt
# Lo script viaggia compresso (gzip+base64) e si esegue con node in /tmp del container.
# Il testo stampato va passato a exec-in-container così com'è, senza virgolette esterne.
set -e
f="$1"; shift
b=$(gzip -9c "$f" | base64 -w0)
n=$(basename "$f" .js)
printf 'echo %s | base64 -d | gunzip > /tmp/%s.js && %s timeout 170 node /tmp/%s.js\n' "$b" "$n" "$*" "$n"
