# Knowly — assets icône

Fichiers pour builds Expo / EAS (iOS App Store, Android, splash).

| Fichier | Usage |
| ------- | ----- |
| `icon.png` | Icône principale **1024×1024** — iOS, Android, web |
| `adaptive-icon.png` | Foreground Android adaptive icon (même visuel) |
| `splash-icon.png` | Logo centré sur l’écran de lancement |
| `icon-source.png` | Master export (recadrage depuis la génération) |

Couleur de fond splash / adaptive : `#EFECE5` (alignée sur la palette warm du logo).

Référencés dans [`app.json`](../../app.json) (`icon`, `splash`, `ios.icon`, `android.adaptiveIcon`).

Pour régénérer après un nouveau logo : remplacer `icon-source.png`, recadrer en carré 1024×1024, puis recopier vers `icon.png`, `adaptive-icon.png`, `splash-icon.png`.

```bash
sips -c 1024 1024 icon-source.png --out icon.png
cp icon.png adaptive-icon.png splash-icon.png
```

Après changement d’icône en dev natif : `npx expo prebuild --clean` puis rebuild iOS.
