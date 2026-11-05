#!/usr/bin/env python3
# w.py — modifiche sul posto conservando i fine riga
#   python3 ~/w.py write <file> [lf|crlf]   contenuto da stdin (file esistente: tiene i suoi fine riga)
#   python3 ~/w.py edit <file>              stdin JSON [[vecchio, nuovo], ...]; ogni vecchio una volta sola
import json, os, sys

def fine(b):
    return '\r\n' if b'\r\n' in b else '\n'

def main():
    cmd, path = sys.argv[1], sys.argv[2]
    if cmd == 'write':
        testo = sys.stdin.read().replace('\r\n', '\n')
        if os.path.exists(path):
            nl = fine(open(path, 'rb').read())
        else:
            nl = '\r\n' if (len(sys.argv) > 3 and sys.argv[3] == 'crlf') else '\n'
        open(path, 'wb').write(testo.replace('\n', nl).encode('utf-8'))
        print(f'scritto {path} ({"CRLF" if nl == chr(13)+chr(10) else "LF"}, {len(testo)} car.)')
    elif cmd == 'edit':
        raw = open(path, 'rb').read()
        nl = fine(raw)
        s = raw.decode('utf-8')
        coppie = json.load(sys.stdin)
        for i, (vecchio, nuovo) in enumerate(coppie):
            v = vecchio.replace('\r\n', '\n').replace('\n', nl)
            n = nuovo.replace('\r\n', '\n').replace('\n', nl)
            c = s.count(v)
            if c != 1:
                sys.exit(f'coppia {i}: trovata {c} volte in {path}, nulla modificato')
            s = s.replace(v, n)
        open(path, 'wb').write(s.encode('utf-8'))
        print(f'modificato {path}: {len(coppie)} sostituzioni')
    else:
        sys.exit('comando sconosciuto')

main()
