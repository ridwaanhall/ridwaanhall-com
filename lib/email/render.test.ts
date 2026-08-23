import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  contactAutoreply,
  contactNotification,
  guestbookAutoreply,
  guestbookNotification,
  guestbookReplyNotification,
} from "./render";

const contact = { name: "Dian", senderEmail: "dian@example.com", message: "Hello there" };
const guestbook = { ...contact, timestamp: "2026-01-23 20:55", guestbookUrl: "https://ridwaanhall.com/guestbook" };
const reply = {
  originalName: "Dian",
  replyName: "Ridwan",
  replyMessage: "Thanks for writing",
  originalMessage: "Hello there",
  timestamp: "2026-01-23 20:55",
  guestbookUrl: "https://ridwaanhall.com/guestbook",
};

const all = () => [
  ["contactNotification", contactNotification(contact)],
  ["contactAutoreply", contactAutoreply(contact)],
  ["guestbookNotification", guestbookNotification(guestbook)],
  ["guestbookAutoreply", guestbookAutoreply(guestbook)],
  ["guestbookReplyNotification", guestbookReplyNotification(reply)],
] as const;

describe("the five transactional emails", () => {
  it("each render both halves, since every one is sent as a pair", () => {
    for (const [name, rendered] of all()) {
      assert.ok(rendered.html.length > 0, `${name}: no html`);
      assert.ok(rendered.text.length > 0, `${name}: no text`);
    }
  });

  /*
   * The failure this exists to prevent: a placeholder shipped to a reader. An
   * email is not a page you can quietly fix afterwards, so `fill` throws rather
   * than leaving `{{ key }}` in the body.
   */
  it("leave no placeholder behind, in either half", () => {
    for (const [name, rendered] of all()) {
      assert.ok(!/\{\{/.test(rendered.html), `${name}: placeholder left in html`);
      assert.ok(!/\{\{/.test(rendered.text), `${name}: placeholder left in text`);
    }
  });

  it("carry the message they were given", () => {
    for (const [name, rendered] of [all()[0], all()[1], all()[2], all()[3]] as const) {
      assert.ok(rendered.text.includes("Hello there"), `${name}: message missing from text`);
    }
  });

  it("are wrapped in a real document, not a bare fragment", () => {
    for (const [name, rendered] of all()) {
      assert.match(rendered.html, /<html|<body|<table/i, `${name}: no document shell`);
    }
  });
});

describe("greetings", () => {
  it("greet by name when there is one", () => {
    assert.ok(contactAutoreply(contact).text.includes("Dian"));
  });

  it("greet 'there' rather than an empty space when the name is blank", () => {
    const anonymous = contactAutoreply({ ...contact, name: "" });
    assert.ok(anonymous.text.includes("there"), anonymous.text.slice(0, 200));
    assert.ok(!/Hi\s*,/.test(anonymous.text), "greeting has a dangling comma");
  });

  it("fall back to the address where a sender's name would go", () => {
    const rendered = contactNotification({ ...contact, name: "" });
    assert.ok(rendered.text.includes("dian@example.com"));
  });
});

describe("escaping in the HTML half", () => {
  /*
   * Every one of these is composed from values a stranger typed into a form.
   * The text half is plain by definition; the HTML half is where markup would
   * execute.
   */
  it("renders typed markup as characters rather than as tags", () => {
    const hostile = "<script>alert(1)</script>";
    const rendered = contactNotification({ ...contact, message: hostile, name: hostile });
    assert.ok(!rendered.html.includes("<script>"), "a script tag reached the html body");
    assert.ok(rendered.html.includes("&lt;script&gt;"));
  });

  it("escapes a hostile sender address too, not only the message", () => {
    const rendered = contactNotification({
      ...contact,
      senderEmail: '"><img src=x onerror=alert(1)>',
    });
    assert.ok(!rendered.html.includes("<img src=x"), "an attribute break reached the html body");
  });

  it("keeps the message readable in the text half", () => {
    const rendered = contactNotification({ ...contact, message: "a < b & c" });
    assert.ok(rendered.text.includes("a < b & c"), "the text half should not be escaped");
  });
});

describe("the reply notification", () => {
  it("names both people and quotes both messages", () => {
    const rendered = guestbookReplyNotification(reply);
    for (const value of ["Ridwan", "Thanks for writing", "Hello there"]) {
      assert.ok(rendered.text.includes(value), `missing ${value}`);
    }
  });

  it("greets 'there' when the person being replied to has no name", () => {
    const rendered = guestbookReplyNotification({ ...reply, originalName: "" });
    assert.ok(rendered.text.includes("there"));
  });

  it("links back to the guestbook", () => {
    assert.ok(guestbookReplyNotification(reply).html.includes(reply.guestbookUrl));
  });
});
