import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { aiLanguages, modelsByLines, promptsPerSession, shapeWakatimeYear, topThree } from "./wakatime-year";

/** A share to two decimals, the precision every breakdown here is written at. */
const pct = (part: number, whole: number) => Math.round((part / whole) * 10000) / 100;

describe("topThree", () => {
  it("shares each breakdown's own total, so no row passes 100%", () => {
    // The shape that drew Windows at 101%: the systems breakdown counts time
    // the year's language total leaves out, so its rows outweigh that total.
    const rows = topThree([
      { name: "Windows", total_seconds: 3_459_000 },
      { name: "Linux", total_seconds: 116_100 },
    ]);
    assert.deepEqual(
      rows.map((row) => row.name),
      ["Windows", "Linux"],
    );
    assert.ok(rows.every((row) => row.percent <= 100));
    assert.ok(Math.abs(rows.reduce((sum, row) => sum + row.percent, 0) - 100) < 0.01);
  });

  it("drops a row too small to draw and keeps three", () => {
    const rows = topThree([
      { name: "A", total_seconds: 600 },
      { name: "B", total_seconds: 300 },
      { name: "C", total_seconds: 99 },
      { name: "D", total_seconds: 1 },
      { name: "E", total_seconds: 0 },
    ]);
    assert.deepEqual(
      rows.map((row) => row.name),
      ["A", "B", "C"],
    );
  });
});

describe("modelsByLines", () => {
  it("ranks by lines, shares every line in the breakdown, and carries no cost", () => {
    // Cost is in the real body, and ordered against the lines here, so a
    // ranking that read it would come out the other way round.
    const body = [
      { name: "Sonnet", lines: 100, cost: 900 },
      { name: "Copilot", lines: 600, cost: 5 },
      { name: "Opus", lines: 200, cost: 700 },
      { name: "Haiku", lines: 100, cost: 1 },
    ];
    const models = modelsByLines(body);
    // Haiku and Sonnet tie on 100 lines; the name decides.
    assert.deepEqual(
      models.map((model) => model.name),
      ["Copilot", "Opus", "Haiku"],
    );
    // Shares of all 1,000 lines, the cut fourth row included.
    assert.deepEqual(
      models.map((model) => model.percent),
      [pct(600, 1000), pct(200, 1000), pct(100, 1000)],
    );
    assert.deepEqual(
      models.map((model) => model.value),
      ["600", "200", "100"],
    );
    for (const model of models) {
      assert.ok(!("cost" in model));
      assert.ok(!JSON.stringify(model).includes("$"));
    }
  });

  it("leaves out a model with no lines", () => {
    const models = modelsByLines([
      { name: "Zeta", lines: 50 },
      { name: "Alpha", lines: 50 },
      { name: "Idle", lines: 0 },
    ]);
    assert.deepEqual(
      models.map((model) => [model.name, model.percent]),
      [
        ["Alpha", pct(50, 100)],
        ["Zeta", pct(50, 100)],
      ],
    );
  });

  it("is empty for nothing", () => {
    assert.deepEqual(modelsByLines(undefined), []);
    assert.deepEqual(modelsByLines(null), []);
    assert.deepEqual(modelsByLines([]), []);
  });
});

describe("aiLanguages", () => {
  const HOUR = 3600;

  it("shares each language's AI Coding time against its AI plus other coding time", () => {
    const rows = aiLanguages({
      data: {
        languages: [
          { name: "TypeScript", total_seconds: 1, ai_coding_seconds: 9 * HOUR, manual_coding_seconds: 1 * HOUR },
          { name: "Python", total_seconds: 1, ai_coding_seconds: 2 * HOUR, manual_coding_seconds: 8 * HOUR },
        ],
      },
    });
    // Ten hours each, a tie on time broken on the name. `total_seconds` is
    // deliberately wrong above: the two parts are the denominator.
    assert.deepEqual(
      rows.map((row) => [row.name, row.percent]),
      [
        ["Python", (2 / 10) * 100],
        ["TypeScript", (9 / 10) * 100],
      ],
    );
    assert.equal(rows[0].ai_seconds, 2 * HOUR);
    assert.equal(rows[0].manual_seconds, 8 * HOUR);
  });

  it("orders by total time, not by how AI-heavy a language is", () => {
    const rows = aiLanguages({
      data: [
        { name: "Small", ai_coding_seconds: 2 * HOUR, manual_coding_seconds: 0 },
        { name: "Big", ai_coding_seconds: 1 * HOUR, manual_coding_seconds: 9 * HOUR },
      ],
    });
    assert.deepEqual(
      rows.map((row) => [row.name, row.percent]),
      [
        ["Big", (1 / 10) * 100],
        ["Small", 100],
      ],
    );
  });

  /*
   * The floor is what keeps a language opened for a minute, with an agent
   * running throughout, from heading the panel at 100%.
   */
  it("leaves out a language under the floor and a row with no time", () => {
    const rows = aiLanguages(
      {
        data: {
          languages: [
            { name: "Under", ai_coding_seconds: HOUR / 2 - 1, manual_coding_seconds: HOUR / 2 },
            { name: "At", ai_coding_seconds: HOUR / 2, manual_coding_seconds: HOUR / 2 },
            { name: "Zero", ai_coding_seconds: 0, manual_coding_seconds: 0 },
          ],
        },
      },
      5,
      HOUR,
    );
    assert.deepEqual(
      rows.map((row) => row.name),
      ["At"],
    );
    // And by default: a minute of nothing but AI is not a row.
    assert.deepEqual(
      aiLanguages({ data: { languages: [{ name: "Blip", ai_coding_seconds: 60, manual_coding_seconds: 0 }] } }),
      [],
    );
  });

  it("keeps the five biggest", () => {
    const languages = Array.from({ length: 7 }, (_, index) => ({
      name: `L${index}`,
      ai_coding_seconds: HOUR,
      manual_coding_seconds: (index + 1) * HOUR,
    }));
    assert.deepEqual(
      aiLanguages({ data: { languages } }).map((row) => row.name),
      ["L6", "L5", "L4", "L3", "L2"],
    );
  });

  it("is empty for a failed or empty call", () => {
    assert.deepEqual(aiLanguages(null), []);
    assert.deepEqual(aiLanguages(undefined), []);
    assert.deepEqual(aiLanguages({}), []);
    assert.deepEqual(aiLanguages({ data: [] }), []);
    assert.deepEqual(aiLanguages({ data: {} }), []);
  });
});

describe("promptsPerSession", () => {
  it("prefers WakaTime's own average", () => {
    assert.equal(
      promptsPerSession({ ai_prompt_events_avg_per_session: 6, ai_sessions: 2, ai_prompt_events_total: 100 }),
      "6",
    );
  });

  it("divides prompts by sessions when the average is missing", () => {
    // 3,845 / 626 = 6.142..., written to one decimal.
    assert.equal(promptsPerSession({ ai_sessions: 626, ai_prompt_events_total: 3845 }), "6.1");
  });

  it("is zero rather than NaN with no sessions", () => {
    assert.equal(promptsPerSession({}), "0");
    assert.equal(promptsPerSession(null), "0");
  });
});

describe("shapeWakatimeYear", () => {
  it("returns nothing without the stats body, whatever else arrived", () => {
    assert.equal(shapeWakatimeYear(null, null, null), null);
    assert.equal(shapeWakatimeYear({}, {}, {}), null);
    assert.equal(shapeWakatimeYear({ data: [] } as never, { data: { days: [] } }, { data: [] }), null);
  });

  it("renders a year whose breakdowns are all empty without throwing", () => {
    for (const languages of [null, {}, { data: [] }]) {
      const year = shapeWakatimeYear({ data: {} }, null, languages);
      assert.ok(year);
      assert.deepEqual(year.categories, []);
      assert.deepEqual(year.editors, []);
      assert.deepEqual(year.models, []);
      assert.deepEqual(year.projects, []);
      assert.deepEqual(year.ai_languages, []);
      assert.equal(year.has_ai_languages, false);
      assert.equal(year.ai_prompt_median, "0 chars");
      assert.equal(year.ai_prompts_per_session, "0");
    }
  });

  it("keeps the top three categories and editors by time, and no spend", () => {
    const year = shapeWakatimeYear(
      {
        data: {
          categories: [
            { name: "Writing Docs", total_seconds: 40 },
            { name: "Coding", total_seconds: 500 },
            { name: "AI Coding", total_seconds: 400 },
            { name: "Writing Tests", total_seconds: 20 },
          ],
          editors: [
            { name: "Claude Code", total_seconds: 350 },
            { name: "VS Code", total_seconds: 650 },
          ],
          ai_prompt_length_median_per_session: 1234,
        },
      },
      null,
      { data: { languages: [{ name: "Go", ai_coding_seconds: 3600, manual_coding_seconds: 3600 }] } },
    );
    assert.ok(year);
    const whole = 500 + 400 + 40 + 20;
    assert.deepEqual(
      year.categories.map((row) => [row.name, row.percent]),
      [
        ["Coding", pct(500, whole)],
        ["AI Coding", pct(400, whole)],
        ["Writing Docs", pct(40, whole)],
      ],
    );
    assert.deepEqual(
      year.editors.map((row) => [row.name, row.percent]),
      [
        ["VS Code", pct(650, 1000)],
        ["Claude Code", pct(350, 1000)],
      ],
    );
    assert.equal(year.ai_prompt_median, "1,234 chars");
    assert.equal(year.has_ai_languages, true);
    assert.ok(!("ai_spend" in year));
  });

  it("never returns a private project's name, and counts its time as Other", () => {
    const year = shapeWakatimeYear(
      {
        data: {
          projects: [
            { name: "Acme-Client", total_seconds: 300 },
            { name: "internal-tool", total_seconds: 300 },
            { name: "Gempa", total_seconds: 400 },
          ],
        },
      },
      null,
      null,
    );
    assert.ok(year);
    assert.deepEqual(
      year.projects.map((row) => [row.name, row.percent]),
      [
        ["Other", pct(600, 1000)],
        ["gempa", pct(400, 1000)],
      ],
    );
    const body = JSON.stringify(year);
    assert.ok(!body.includes("Acme"));
    assert.ok(!body.includes("internal-tool"));
  });
});
