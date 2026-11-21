# THE ERROR SQUAD

A BSIT group portfolio with eight browser applications. Unzip the entire folder and open **index.html** in a current desktop browser. All source files are editable. There is no package install or build step.

## Run a classroom demonstration

1. Open the homepage, use the project filters or search, and choose **View project**. Preview opens a short project summary.
2. For shared browser storage, cross-tab chat, and camera testing, serve the extracted folder locally. Open a terminal in the folder containing index.html and run:

   ```sh
   python -m http.server 8000 --bind 127.0.0.1
   ```

   On Windows, use `py -m http.server 8000 --bind 127.0.0.1` if Python is installed through the Windows launcher. Open **http://localhost:8000**. Press Ctrl+C to stop. For phone camera testing, use the HTTPS site on the phone itself.
3. Try the gallery, calculator, game and sentiment analyzer offline. The fonts have system fallbacks. Weather and the two vision models download data when used. Each vision project includes a separately labeled offline sample.

## Project guide

| Activity | Try this | Requirements and behavior |
| --- | --- | --- |
| Gallery Portfolio | Filter to Curves, open Tidal rings, zoom, then use the arrow keys. Escape closes the lightbox. | Three local SVG posters preserve the original names and design notes. |
| Simple Calculator | Type 2.5+3*4 and press Enter for 14.5. Try dividing by zero and edit the expression with Backspace. | Four operations with precedence, decimal and negative numbers. Results use up to 14 significant digits. Stores the last 30 calculations. |
| Weather Application | Search Cagwait, Cebu, Baguio, or another city. Toggle °C/°F. | Open-Meteo geocoding, current conditions and up to five forecast days. Sample readings identify their actual sample city. |
| Seven-stick Strategy | Take one or two sticks each turn. Taking the final stick wins. | Strategic mode tries to leave a multiple of three. Casual mode chooses a legal move at random. Restart cancels a pending computer turn. |
| Realtime Chat | On localhost, open Chat in two tabs with different display names. Type in one tab and send. | Local transport exchanges real events. Optional Supabase Broadcast supports connected users across devices. The last 100 messages are held locally per room. |
| Image Classifier AI | Drop a JPEG, PNG or WebP up to 10 MB, or choose the studio illustration, then select Classify image. | TensorFlow.js runs MobileNet V2 in the browser. Scores are model probabilities over ImageNet labels. Photos generally match its training domain better than illustrations. |
| Sentiment Analyzer AI | Enter an English review combining praise and criticism. Inspect the overall label, signed score and mixed cue explanation. | Included multinomial naïve Bayes model trains locally on 75 labeled example snippets. Limited vocabulary, sarcasm and unfamiliar topics reduce accuracy. Magnitude indicates strength in this model and is not calibrated confidence. Stores the last 20 results. |
| Hand Gesture Classifier AI | Start camera, allow access, and hold one hand in frame. Stop releases the stream. | MediaPipe Gesture Recognizer loads the task and WASM runtime. HTTPS or localhost, network access and an available camera are needed. Sample poses are manually labeled. |

## Group details and contact

Edit **js/config.js**. Put the group's email in `email`. The default contact action opens a prefilled email draft in the visitor's mail app. With an empty email setting, the visitor supplies the recipient there. Successful delivery depends on the mail app and the user's Send action.

For form-service delivery, create a group-owned form endpoint that accepts FormData POST and JSON responses, for example a Formspree endpoint. Put the complete HTTPS URL in `formEndpoint`, enable the site origin if required, and submit a test message to your own inbox. A successful HTTP response displays a service acknowledgement. Failed requests preserve the message.

Set `social` to an array of objects with `label` and `url` (HTTPS only). The eight member profiles are already filled in `team` in **js/config.js**. Each member card shows `name`, `role`, `line`, `photo` and the first About paragraph. **View profile** (or clicking the card) opens the full profile built from `tags`, `info` (label/value pairs), `sections` (title and paragraphs), `interests`, `motto` and `mottoTitle`. Use the Prev/Next buttons or the arrow keys to move between members. To use a real photo, copy it into `assets/team/` and change that member's `photo` path.

## External services

See **SERVICES.md** for the Open-Meteo endpoints, Supabase setup, public room permissions and a two-device test. Configure the browser-safe Supabase URL and publishable key in **js/services/chat-config.js**. Never include a secret or service-role key.

The image classifier loads TensorFlow.js 4.22.0 and MobileNet 2.1.1 through jsDelivr, then requests the pretrained weights. The gesture classifier loads MediaPipe Tasks Vision 0.10.22-rc.20250304 from jsDelivr and Google's hosted Gesture Recognizer model. Network filters, device memory or camera permissions can prevent model startup. Local inference reads the selected image or camera frames in the browser. The app does not upload those frames to an inference endpoint.

## Motion and effects

Scroll progress bar, reveal-on-scroll, parallax hero, rotating headline word, scroll-speed marquee, count-up metrics, card spotlight and back-to-top button. All of it switches off automatically for visitors who enable *reduce motion* in their system settings. Effects live in **js/shared.js** (all pages) and **js/main.js** (homepage).

## Source map

- **index.html**, **css/style.css** and **js/main.js** contain the homepage, navigation, responsive layouts, filters and contact form.
- **js/shared.js** provides theme, saved settings, status notices and shared controls.
- **projects/** contains one directory per application, with its entry page and JavaScript. Calculator and game rules have separate engine files.
- **js/models/** and **js/services/** contain the model and network adapters.
- **assets/** contains the original SVG illustrations, posters, logo and abstract member avatars.
- **original/index.html** opens the previous HTML/CSS edition, including all eight original activities and examples. Bookmarks using the old **activities/** paths open their upgraded counterparts.

## Verification

Browser checks opened all eight projects. The homepage theme switch, search, category filter, project preview, phone navigation and contact validation were exercised. The gallery lightbox, next and zoom controls worked. The calculator returned 4 for 8÷2 and 10 for 2.5×4, reported division by zero, and cleared its saved history. A seven-stick round reached the result dialog and restarted. Two separate tabs exchanged a message and a typing indicator.

The browser fetched a live Cagwait forecast, switched temperature units, and showed a labeled sample for an unknown city. MobileNet downloaded and returned three scored labels for a locally generated illustration. This verifies inference, not prediction accuracy. Sentiment analysis produced positive and mixed readings from entered text. The gesture screen handled a missing camera and displayed its sample pose library.

Additional checks covered calculator precedence and errors, branching game outcomes, local links and assets, JavaScript syntax, weather errors with fixtures, and Supabase callback behavior with a mock client. Responsive checks included phone- and tablet-width containers. No Lighthouse score was measured.

**Still requires device or account testing:** physical webcam recognition and landmarks, photo-library picker and drag-and-drop on target devices, connected Supabase delivery between two devices, and actual email/form receipt. Verify the group's configured social links and contact details after replacing the placeholders.
