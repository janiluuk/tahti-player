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

The desktop app updates itself. The browser version at [beta.tahti.live](https://beta.tahti.live) is always the latest, so there is nothing to update there.

### The update notice

About ten seconds after the app starts, and then every six hours while it runs, Tahti Player checks GitHub Releases for a newer version. When there is one, a notice says "Tahti Player <version> is available" and stays on screen.

1. Choose **Install** on the notice. The update downloads and installs in the background.
2. When it is done, the notice changes to "Update installed". Choose **Restart** to start the new version.

If the install fails, the notice says "Could not install the update" and why. You can try again from Settings.

### Settings → Integrations → Desktop app

This section only appears in the desktop app.

- **Check for updates** shows the version you have. Turn it off to stop the automatic checks and the notice.
- **Check now** checks right away, even with **Check for updates** off. It says "You have the latest version." when there is nothing new.
- When a new version is found, you see its release notes and an **Install <version>** button. A progress bar shows the download.
- After the install, choose **Restart to finish**.

### Which installs update themselves

The Windows installer, the macOS app, the AppImage and the `.deb` package update from inside the app. The snap is installed from a file, so the app can't replace it: download the new `.snap` from [GitHub Releases](https://github.com/janiluuk/tahti-player/releases/latest) and install it the same way as the first time.
