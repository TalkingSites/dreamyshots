---
layout: base.njk
title: Contact
description: Get in touch before your event.
permalink: "/contact/"
---

<div class="ds-contact-page">
  <div class="ds-contact-inner">
    <h1 class="ds-contact-title">Get in touch</h1>

    <p class="ds-contact-intro">
      Want to talk through your event before committing? Happy to answer
      questions about what to expect, how the day runs, or anything else.
    </p>

    <p class="ds-contact-book-note">
      Ready to book?
      <a href="{{ site.bookingUrl }}" target="_blank" rel="noopener">
        Reserve your date directly
        <i class="bi bi-arrow-up-right" aria-hidden="true" style="font-size:0.75em;"></i>
      </a>
    </p>

    <form class="ds-contact-form"
          name="contact"
          method="POST"
          data-netlify="true"
          netlify-honeypot="bot-field"
          novalidate>

      <!-- Honeypot: hidden from humans, catches bots -->
      <p hidden aria-hidden="true">
        <label>Do not fill this in: <input name="bot-field" tabindex="-1" autocomplete="off"/></label>
      </p>

      <div class="ds-form-group">
        <label class="ds-form-label" for="contact-name">Name</label>
        <input class="ds-form-input"
               type="text"
               id="contact-name"
               name="name"
               placeholder="Your name"
               required/>
      </div>

      <div class="ds-form-group">
        <label class="ds-form-label" for="contact-email">Email</label>
        <input class="ds-form-input"
               type="email"
               id="contact-email"
               name="email"
               placeholder="you@example.com"
               required/>
      </div>

      <div class="ds-form-group">
        <label class="ds-form-label" for="contact-event">Event type</label>
        <input class="ds-form-input"
               type="text"
               id="contact-event"
               name="event_type"
               placeholder="e.g. Corporate gala, wedding, conference"/>
      </div>

      <div class="ds-form-group">
        <label class="ds-form-label" for="contact-message">Message</label>
        <textarea class="ds-form-textarea"
                  id="contact-message"
                  name="message"
                  placeholder="Tell me about the event..."
                  required></textarea>
      </div>

      <button type="submit" class="ds-cta ds-form-submit">
        Send message
      </button>

    </form>
  </div>
</div>
