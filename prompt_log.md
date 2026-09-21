# Prompt Log — Overberg (Problem Set 3)

**Student:** Keziah Sherlyn Vanessa Vickraman · **Course:** MGMT 6110 · **Problem Set 3**  
**Repository:** https://github.com/KeziahVickraman-MBAI/mgmt6110_ps3_base  
**Live link:** https://mgmt6110ps3base.vercel.app/  

---

## Session Prompt Log

### Prompt 1 · Disqus Comment Section

**Date/Time:** 2026-09-21T09:48:56-07:00

```text
* ROLE: You are a front-end developer working in my existing project. Add to it; do not rewrite what is already there.

* GOAL: Add a Disqus comment section to the bottom of my main page only, so that visitors can leave feedback on the product in a single thread.

* CONTEXT:
- My Disqus shortname is: overberg-ps3
- My live address is: https://mgmt6110ps3base.vercel.app/

* OUTPUT: A small component on the main page that loads the Disqus Universal Code once, with
page.url set to my full live address (https, and no query string) and page.identifier set to the fixed string "home". Put one short line above it inviting visitors to say what worked for them and what did not.

* GUARDRAILS: Load the Disqus script only once, even when the component re-renders. Mount it
on the main page only, so that every comment lands in one thread. 
**Do not change anything else on the page, and add no npm package without telling me why one is needed.
```

#### Outcome & Actions:
- Created modular component in `src/comments.ts` (`renderCommentsSection` and `initDisqus`).
- Configured Disqus with:
  - Shortname: `overberg-ps3` (`https://overberg-ps3.disqus.com/embed.js`)
  - Canonical page URL: `https://mgmt6110ps3base.vercel.app/`
  - Single thread identifier: `'home'`
  - Invitation copy: `"Let us know what worked for you and what did not."`
- Implemented script loading guard (`disqusScriptLoaded` flag + element check) to load the script strictly once.
- Added DOM preservation logic across `render()` calls in `src/main.ts` so that state changes/re-renders do not destroy or churn the active Disqus thread.
- Added matching styles in `style.css` for `.comments-section` and `.comments-invitation`.
- Zero npm packages installed; no other features changed.
- **Commit:** `6462d21` (`Add Disqus comment section to bottom of main page`)

---

### Command 1 · Git Push

**Date/Time:** 2026-09-21T09:52:18-07:00

```bash
git push https://<GITHUB_TOKEN>@github.com/KeziahVickraman-MBAI/mgmt6110_ps3_base.git main
```

#### Outcome & Actions:
- Pushed commit `6462d21` to `https://github.com/KeziahVickraman-MBAI/mgmt6110_ps3_base.git` on branch `main`.

---

### Prompt 2 · Microsoft Clarity & Privacy Notice

**Date/Time:** 2026-09-21T09:56:16-07:00

```text
* ROLE: You are a front-end developer working in my existing project.

* GOAL: Add Microsoft Clarity to my product, together with a privacy notice that covers both Microsoft Clarity and Disqus.

* CONTEXT:
- My live address is: https://mgmt6110ps3base.vercel.app/
- Clarity gave me this tracking code:
<script type="text/javascript">
    (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "ylvadgh5kh");
</script>

* OUTPUT:
1) Add the tracking code to the head of index.html, wrapped so that it runs only when
   window.location.hostname is exactly my live address's hostname. Keep the project ID
   inside the code exactly as Clarity provided it.
2) Add this notice to the footer of every page, with the three links working:
   "This page uses Microsoft Clarity and Disqus, which use cookies to record how visitors
   use the site and to host comments. By using this page you agree that we and Microsoft
   may collect and use this data. See the Microsoft Privacy Statement
   (https://www.microsoft.com/privacy/privacystatement), the Disqus privacy policy
   (https://disqus.com/privacy-policy/) and the Disqus data sharing settings
   (https://disqus.com/data-sharing-settings/)."

* GUARDRAILS: Do not edit the project ID. Do not load the tracking code twice. Do not change anything else on the page.
```

#### Outcome & Actions:
- Added Microsoft Clarity snippet into `<head>` of `index.html` wrapped in:
  ```javascript
  if (window.location.hostname === "mgmt6110ps3base.vercel.app") { ... }
  ```
- Kept project ID `"ylvadgh5kh"` untouched exactly as provided.
- Added the privacy notice to the footer in `src/main.ts` with all 3 working links:
  - Microsoft Privacy Statement: `https://www.microsoft.com/privacy/privacystatement`
  - Disqus privacy policy: `https://disqus.com/privacy-policy/`
  - Disqus data sharing settings: `https://disqus.com/data-sharing-settings/`
- Added `.footer-privacy` styles in `style.css` consistent with the existing footer disclaimer.
- Guardrails satisfied: tracking code loaded once, project ID unmodified, no other elements changed.
- **Commit:** `0364135` (`Add Microsoft Clarity tracking and privacy notice for Clarity and Disqus`)

---

### Command 2 · Git Push

**Date/Time:** 2026-09-21T09:57:55-07:00

```bash
git push https://<GITHUB_TOKEN>@github.com/KeziahVickraman-MBAI/mgmt6110_ps3_base.git main
```

#### Outcome & Actions:
- Pushed commit `0364135` to `https://github.com/KeziahVickraman-MBAI/mgmt6110_ps3_base.git` on branch `main`.

---

### Prompt 3 · Export Prompt Log

**Date/Time:** 2026-09-21T10:05:36-07:00

```text
export my entire prompt log I have included here as a .md file
```

#### Outcome & Actions:
- Generated this complete, structured `.md` prompt log file documenting all prompts, outputs, actions, and commits from this development session.
