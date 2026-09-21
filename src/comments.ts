/**
 * Disqus comments component for the main page feedback thread.
 *
 * Configured with:
 * - Disqus shortname: overberg-ps3
 * - Canonical live URL: https://mgmt6110ps3base.vercel.app/
 * - Single thread identifier: 'home'
 */

let disqusScriptLoaded = false;

export function renderCommentsSection(): string {
  return `
    <!-- COMMENTS · Disqus feedback thread -->
    <section class="comments-section" aria-labelledby="comments-heading">
      <div class="comments-inner">
        <p class="comments-invitation" id="comments-heading">
          Let us know what worked for you and what did not.
        </p>
        <div id="disqus_thread"></div>
      </div>
    </section>
  `;
}

export function initDisqus(): void {
  const container = document.getElementById('disqus_thread');
  if (!container) return;

  // Set the canonical configuration before loading or resetting
  (window as any).disqus_config = function (this: any) {
    this.page.url = 'https://mgmt6110ps3base.vercel.app/';
    this.page.identifier = 'home';
  };

  // Guard: load the Disqus Universal Code script ONLY ONCE, even when the component re-renders
  if (!disqusScriptLoaded && !document.getElementById('dsq-embed-scr')) {
    disqusScriptLoaded = true;
    const d = document;
    const s = d.createElement('script');
    s.id = 'dsq-embed-scr';
    s.src = 'https://overberg-ps3.disqus.com/embed.js';
    s.setAttribute('data-timestamp', String(+new Date()));
    (d.head || d.body).appendChild(s);
  } else if ((window as any).DISQUS) {
    // If Disqus is already loaded and needs synchronization across page state changes
    try {
      (window as any).DISQUS.reset({
        reload: true,
        config: function (this: any) {
          this.page.url = 'https://mgmt6110ps3base.vercel.app/';
          this.page.identifier = 'home';
        },
      });
    } catch {
      // Container is already mounted and active
    }
  }
}
