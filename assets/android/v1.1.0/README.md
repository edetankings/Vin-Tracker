# Vin Tracker Android icon assets — 1.1.0

These are replacement icon resources, not a built APK or an Android build project.
The running app remains password-free and saves data locally in the browser.

| Asset                            | Size      | Use                                    |
| -------------------------------- | --------- | -------------------------------------- |
| `play-store-icon-512.png`        | 512 × 512 | Store listing or APK packaging service |
| `mipmap-mdpi/ic_launcher.png`    | 48 × 48   | Android legacy launcher icon           |
| `mipmap-hdpi/ic_launcher.png`    | 72 × 72   | Android legacy launcher icon           |
| `mipmap-xhdpi/ic_launcher.png`   | 96 × 96   | Android legacy launcher icon           |
| `mipmap-xxhdpi/ic_launcher.png`  | 144 × 144 | Android legacy launcher icon           |
| `mipmap-xxxhdpi/ic_launcher.png` | 192 × 192 | Android legacy launcher icon           |

The full-size logo and padded maskable master are in `assets/branding/v1.1.0`.
Versioned 192px and 512px normal/maskable icons are exposed by the app's web
manifest. Android APK packaging tools can use those public icon URLs or the PNGs
in this directory. If a native project uses an adaptive launcher icon, use its
Image Asset tool with the padded master to produce the matching foreground and
background layers; the existing adaptive resource configuration may override
legacy PNG icons.

## Updating an existing native APK

Use the original Android project or packaging service, keep its existing package
ID, set `versionName` to `1.1.0`, and increase `versionCode` above its last release.
Rebuild with its established signing configuration. No native package ID,
versionCode or signing key has been guessed or changed in this web repository.
Do not replace an existing app with an unrelated APK or uninstall it to change
its logo: that can separate or remove its saved data.

An APK must be signed to install. Signing is a build requirement, not an app login
password. A build system can manage signing, but updating an already-installed
APK requires the compatible signing identity. Do not put signing keys, passwords
or keystores in this public repository.

[Android app updates](https://developer.android.com/google/play/app-updates)
