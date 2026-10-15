---
description: Download and install Tahti Player on your platform
---

# Installation

You don't have to install anything to listen: [beta.tahti.live](https://beta.tahti.live) runs in the browser. The desktop app is the same app in its own window, plus your local music library, Tahti Jam, the MCP and MPD servers and Discord Rich Presence.

Download the latest release from [GitHub Releases](https://github.com/janiluuk/tahti-player/releases/latest). Pick the file for your platform; `x.y.z` is the version number.

{% tabs %}

{% tab title="Windows" %}

| File | What it is |
| ---- | ---------- |
| `Tahti.Player_x.y.z_x64-setup.exe` | Installer for 64-bit Windows. Installs for your user only, no admin rights needed. |

Run the installer and follow the prompts. Tahti Player is then in the Start menu.

The installer isn't signed, so Windows SmartScreen may warn about an unknown publisher. Choose **More info**, then **Run anyway**.

{% endtab %}

{% tab title="macOS" %}

| File | What it is |
| ---- | ---------- |
| `Tahti.Player_aarch64.app.tar.gz` | Apple Silicon Macs (M1 and later). |
| `Tahti.Player_x64.app.tar.gz` | Intel Macs. |

Double-click the file to unpack it, then drag **Tahti Player** to your Applications folder.

### Gatekeeper warning

Tahti Player isn't signed with an Apple Developer certificate, so macOS blocks it the first time. To allow it:

1. Right-click the app in Applications and choose **Open**.
2. Choose **Open** in the dialog.

If macOS still refuses, run this in Terminal:

```bash
xattr -r -d com.apple.quarantine "/Applications/Tahti Player.app"
```

You only need to do this once.

{% endtab %}

{% tab title="Linux" %}

| File | What it is |
| ---- | ---------- |
| `Tahti.Player_x.y.z_amd64.AppImage` | Runs on most distributions without installing. |
| `Tahti.Player_x.y.z_amd64.deb` | Package for Ubuntu, Debian, Linux Mint, Pop!\_OS and other Debian-based distributions. |
| `tahti-player_x.y.z_amd64.snap` | Snap package. |

### AppImage

```bash
chmod +x Tahti.Player_*_amd64.AppImage
./Tahti.Player_*_amd64.AppImage
```

### Debian / Ubuntu

```bash
sudo apt install ./Tahti.Player_*_amd64.deb
```

### Snap

Tahti Player isn't in the Snap Store yet, so install the downloaded file with `--dangerous` (it isn't signed by the store):

```bash
sudo snap install --dangerous ./tahti-player_*_amd64.snap
```

There are no Flatpak, RPM or AUR packages. Fedora, openSUSE and Arch users can use the AppImage.

{% endtab %}

{% endtabs %}

## Updating

Download and install the new release the same way. Your library, settings and sign-in are kept.
