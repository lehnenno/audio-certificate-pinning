#### Die Extension ist nur mit firefox kompatibel.


# Installation
Die .xpi Datei kann mit Firefox ausgeführt werden. In Firefox sollte dann ein kleines Fenster geöffnet werden. Hier müssen der Extension die gewünschten Zugriffsrechte erteilt werden. Danach sollte die Extension installiert sein. Ein kleiner grüner Punkt sollte in der oberen rechten Ecke des Browsers zu sehen sein über den die Extension bedient wird.

#
#

# Selber builden
Benötigt wird nodejs (Version 12.x oder neuer) mit npm

#### Folgende Befehle müssen im Projektordner ausgeführt werden:
    npm install
    npm run build

Im firefox kann dann unter 'about:debugging#/runtime/this-firefox' eine temporäre Extension hinzugefügt werden. Dazu die manifest.json aus dem build Ordner auswählen.

#### Alternativ mit web-ext folgende Befehle:
    cd build
    npx web-ext run
