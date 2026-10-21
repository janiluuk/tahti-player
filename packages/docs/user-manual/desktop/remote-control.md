---
description: Control Tahti Player from your phone or any other device on your network.
---

# Remote control

Tahti Jam turns any device with a web browser into a remote for the Tahti Player desktop app. Scan a QR code with your phone and you can control playback, see the queue and add tracks. Handy for parties, cooking, your housemates, and so on.

This is **not** the shared listening Jam on the web app (`/jam/$code`, started from a playlist). That feature is described in [Listen together (Jam)](../listening/jam.md).

How does it work? The desktop app starts a small web server on your computer. Your phone connects to it directly over your own network, so nothing goes through a Tahti server. Only devices you have paired can control the player.

## Enable Tahti Jam

1. Open the Tahti Player desktop app and go to **Settings → Integrations**.
2. Turn on **Tahti Jam**.
3. A QR code and a link appear under the switch. The link looks like `http://192.168.1.42:4120/remote#token=…`; the part after `#token=` is the pairing code.

The server uses a port in the 4120-4129 range. Devices need to be on the same Wi-Fi (or wired network) as the computer.

{% hint style="warning" %}
Anyone with the link can control the player. **New pairing link** makes a new code and unpairs every device paired before, so use it if you shared the link with someone who shouldn't keep it.
{% endhint %}

## Connect from your phone

Scan the QR code with your phone's camera, or open the link in a browser on any device on the same network. The remote remembers that it's paired and removes the code from the address bar, so next time you can open `http://<your computer>:4120/remote` directly.

If the phone isn't paired (or a new pairing link replaced its code), the remote says **Not paired** and asks you to scan the code again in Settings → Integrations → Tahti Jam.

## What the remote does

The remote UI is a single screen with four sections: a search bar in the header, now playing, controls, and the queue.

<figure><img src="../../.gitbook/assets/jam-remote.png" alt="Tahti Jam remote control UI on a phone showing now playing, controls, and queue" width="300"><figcaption><p>Tahti Jam on a phone</p></figcaption></figure>

- **Now playing** at the top, with cover art, track title, and artist.
- **Controls** in the middle: previous, play/pause, next, plus a seek bar, shuffle, and repeat.
- **Queue** at the bottom, with the currently playing track highlighted. Each item has an X button to remove it from the queue.

A badge in the header shows the connection status: **Connecting**, **Connected** or **Disconnected**. The remote retries a few times before it says it can't connect.

Anything you do on the remote happens in Tahti Player immediately, and vice versa: skipping a track on the desktop updates every connected remote. Multiple devices can connect at the same time and they all stay in sync.

### Searching for music

Use the search bar at the top to search Tahti. A drawer slides down with matching tracks.

Click (or tap) a track to add it to the queue. The drawer will close after adding. If the queue was empty, playback starts automatically.

### Removing tracks from the queue

Each queue item shows an X button on the right side. Tap it to remove that track from the queue.
