---
description: Upload audio, follow processing, edit a track, control who can hear and download it, and import from other services.
---

# Uploads and tracks

## Upload

Open **Studio → Upload** (or **Library → Upload**), or press **Upload** on **Library → Sounds**.

1. Choose an audio file: FLAC, WAV, AIFF, MP3, M4A or OGG, up to 4 GB.
2. Press **Upload**. If you don't give a title, the file name becomes the title; you can change it afterwards.
3. You're taken to the track's page while it processes.

Uploads without artwork get an abstract cover automatically.

## Processing

While a track is being processed (just uploaded, or re-processed after an edit), it shows a **Processing** spinner: on its page in place of the waveform, and on its row in **Library → Sounds**. You can edit its details meanwhile, but it can't be played or added to a release until it's ready.

- The blue light at the top left lists everything still processing.
- A notification links to the track when it's done.
- If processing fails, the track says why and offers **Retry processing**.

## Edit a track

The track page (`/studio/sounds/<id>`) has:

- **Details:** title, content type, description, release date, genre, **Audience** (Private, Unlisted or Public), **Allow downloads** and **Allow comments**. Press **Save**.
- **Playlists:** add the track to your playlists.
- **Insights:** plays and listeners for this track.

The header buttons pin the track to your profile, open the audio editor (quick fixes such as auto-trim, and mastering) and more actions.

## Who can listen and download

In the track's edit dialog (**Sharing** and access tabs):

- **Visibility:** Private (only you and share links), Unlisted (anyone with the link) or Public.
- **Share links** for private tracks: send a private link to someone without making the track public.
- **Access:** limit a track to buyers or fan subscribers, or put it on sale.
- **Download gates:** ask listeners to follow you or share the track before downloading.

## Import from other services

**Settings → Add-ons → Import** connects SoundCloud, Mixcloud and hearthis.at (and Bandcamp once its API is approved). Imports are queued; **Import progress** on the Upload page shows each one as Queued, Importing, Imported (with a link to the track) or Failed (with the reason).

Tracks from hearthis.at, Mixcloud, Spotify and Bandcamp can also be linked rather than copied: Tahti keeps the link and the provider's player plays them.

### Mikseri.net

Music you have on [Mikseri.net](https://www.mikseri.net) can be added to a collection as an embed. Open the collection in **Studio** and find **Add your music from Mikseri.net**:

1. Paste the Mikseri track page (`mikseri.net/artists/<artist>/<song>/<id>/`), the official track embed URL, or the numeric track ID. Artist pages aren't accepted, only song pages.
2. Enter the track title and artist name, and optionally a genre (used by collection filters).
3. Turn on **Rights confirmed** (you own the track or have permission to embed it) and add it.

Tahti stores only the embed reference and your details; the audio stays on Mikseri.net and plays in its player.

If the board has blocked your uploads, Upload and the import panels say so instead of starting an import.

## Library → Sounds

- Switch between the card view and a **list view**: a plain table with a small preview, the status and the details of each track. The size control makes rows more or less compact.
- Select tracks and press **Add to a release** to put them on an existing release. If you have none yet, it offers to create one first.

## Other Library tabs

- **Recordings:** your past broadcasts, ready to publish as tracks.
- **Media:** images and video you've uploaded for covers and backdrops.
- **Stash:** private file storage you can share with collaborators.
- **Embeds:** SoundCloud and other embeds you've added.
- **Smart links:** the share pages for your releases.
