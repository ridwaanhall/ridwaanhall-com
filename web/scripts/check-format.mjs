/** Cross-check formatting helpers against the Python originals' behaviour. */
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const dateParts = (v) => { const m = /^(\d{4})-(\d{2})/.exec(v); return m ? {year:+m[1], month:+m[2]} : null; };
const monthYear = (v) => { const p = dateParts(v); return p ? {month: MONTHS[p.month-1], year: p.year} : null; };
const isoMonth  = (v) => { const p = dateParts(v); return p ? `${String(p.year).padStart(4,"0")}-${String(p.month).padStart(2,"0")}` : ""; };

const cases = [["2024-01-15",{month:"Jan",year:2024},"2024-01"],["2021-12-01",{month:"Dec",year:2021},"2021-12"],[null,null,""],["",null,""]];
let ok = true;
for (const [input, my, iso] of cases) {
  const gotMy = monthYear(input), gotIso = isoMonth(input);
  const pass = JSON.stringify(gotMy) === JSON.stringify(my) && gotIso === iso;
  ok &&= pass;
  console.log(pass ? "  ok  " : "  FAIL", JSON.stringify(input), "->", JSON.stringify(gotMy), JSON.stringify(gotIso));
}

// isWorkingHours: weekday (Mon-Fri) and 15 <= hour < 20, Asia/Jakarta.
const isWorking = (now) => {
  const parts = new Intl.DateTimeFormat("en-US",{timeZone:"Asia/Jakarta",weekday:"short",hour:"numeric",hourCycle:"h23"}).formatToParts(now);
  const wd = parts.find(p=>p.type==="weekday")?.value ?? "";
  const h = Number(parts.find(p=>p.type==="hour")?.value ?? -1);
  return ["Mon","Tue","Wed","Thu","Fri"].includes(wd) && h >= 15 && h < 20;
};
// Jakarta is UTC+7. 2026-08-20 is a Thursday.
const wh = [
  ["2026-08-20T08:30:00Z", true,  "Thu 15:30 WIB"],
  ["2026-08-20T12:59:00Z", true,  "Thu 19:59 WIB"],
  ["2026-08-20T13:00:00Z", false, "Thu 20:00 WIB"],
  ["2026-08-20T07:59:00Z", false, "Thu 14:59 WIB"],
  ["2026-08-22T09:00:00Z", false, "Sat 16:00 WIB"],
  ["2026-08-20T17:00:00Z", false, "Fri 00:00 WIB (midnight -> hour 0, not 24)"],
];
for (const [iso, want, label] of wh) {
  const got = isWorking(new Date(iso));
  ok &&= got === want;
  console.log(got === want ? "  ok  " : "  FAIL", label.padEnd(42), got);
}
console.log(ok ? "\nALL PASS" : "\nFAILURES");
process.exit(ok ? 0 : 1);
