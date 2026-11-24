# Cabeçalhos de segurança. Ficam num arquivo à parte porque um add_header dentro de
# um location descarta os do server: cada location com add_header inclui este arquivo.
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header Referrer-Policy "no-referrer" always;
# CSP: só scripts, estilos, fontes e chamadas da própria origem. Reduz o risco de XSS,
# que é o principal risco de guardar o token no sessionStorage (ADR 0011).
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'" always;
