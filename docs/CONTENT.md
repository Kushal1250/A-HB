# Personalise the birthday

## First content

`shared/defaults.json` contains the English defaults for ANU PATEL. You can edit it before the first seed. The sender is **Your friend**; no age, birthday date, photos, audio or invented shared memories have been supplied.

After running `npm run seed`, database content is authoritative. The seed command is idempotent: it will not replace existing edits. The same JSON is bundled into React as a fallback if the API is unavailable. Consequently, public fallback content is part of the frontend source/build. Keep private draft information in the administrator editor instead of the bundled defaults.

## Edit, preview, publish

1. Open `/admin` on the frontend URL.
2. Sign in using the administrator you created from the terminal.
3. Change the names, sender, welcome text, headline, letter, final message, colours and optional chapters.
4. Use `{name}`, `{shortName}` or `{sender}` in the headline, letter and final message when helpful.
5. Click **Save draft**. This stores a private draft only.
6. Click **Preview saved draft**. It opens the full birthday story in an administrator-only dialog.
7. Close the preview and click **Publish saved draft**. Confirm the publication.
8. Open the visitor page to see the publication.

Messages are plain text; HTML is not executed. Paragraph breaks in the letter are preserved. The sender field signs the final reveal and keepsake; edit the letter's signature too, or replace its last line with `{sender}`. Dates are optional calendar dates and never trigger a guessed age or countdown. The stored timezone is validated but this version does not schedule releases.

Changing the search-indexing checkbox updates the page's robots meta tag. The supplied Vercel configuration also sends a noindex header, so remove that header if you explicitly want indexing. Noindex does not make a page private.

## Photos

1. Configure the Cloudinary backend variables.
2. In the editor choose a JPEG, PNG or WebP up to 8 MB.
3. Wait for uploading **and processing** to complete.
4. Enter a truthful caption and a useful description of the image.
5. Optionally set the memory date.
6. Use the up/down buttons to arrange photos.
7. Save, preview and publish.

The editor can attach an already uploaded photo. A maximum of 30 memory entries is allowed. Without photos the birthday page intentionally shows three labelled placeholders, not unrelated stock images.

Images are re-encoded to WebP, resized to a maximum 2000×2000 bounding box and given a separate 640×800 thumbnail. The original uploaded bytes/EXIF are not retained by this app's upload flow. Highly compressed oversized images above 40 million pixels are rejected during processing.

## Music

Upload an MP3 or WAV up to 15 MB, then select it in the Birthday music dropdown. Save and publish. Use only audio you have permission to share. Music never starts without a click. No configured music means a quiet, fully working experience.

To replace music, select the new upload. To remove it, select **No music**, save and publish. The previous upload stays in the file list until you delete it.

## Remove or replace files

Removing a memory asks for confirmation and detaches it from the current unsaved draft. It does **not** delete the cloud asset. Save and publish the removal, then use **Delete file** in Uploaded files. Any asset still referenced by either saved snapshot is protected from deletion.

Uploads that were abandoned before saving can be reused from the file list or deleted. For old unreferenced files there is a cleanup command, from the **project root**:

```powershell
npm run media:cleanup --prefix server
```

This is a dry run. Pause all editing/uploads, review its list, then apply if desired:

```powershell
npm run media:cleanup --prefix server -- --apply
```

It only targets files older than 24 hours that are absent from both draft and publication. Do not run destructive cleanup while another administrator is editing.

## Access and privacy

- The Vercel birthday page and published API are public by default.
- `/admin` can be opened by anyone, but edits, previews, drafts and uploads require authentication.
- Cloudinary assets use authenticated storage; draft delivery links are generated only for authenticated administrators.
- Once published, visitors can fetch the published photos/music and save copies. Ten-minute signed URLs are not a way to prevent that.
- Source-code privacy is separate: use a private repository if preferred, and keep `.env` and private media out of all repositories.
- The existing ChatGPT-hosted frontend preview keeps its previous owner-only access. It is separate from a Vercel deployment.

If you need the **entire deployed birthday to be restricted**, configure hosting access protection or add visitor authentication to both frontend/API before uploading private content. This implementation intentionally follows the requirement that birthday visitors need no account.

## Keepsake

The final scene generates a PNG card in the browser using the recipient, final message and sender. It does not send personal data to an external image service. Text wraps and scales to fit. If canvas export fails, the site displays an error and lets the visitor retry.
