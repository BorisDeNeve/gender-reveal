// Als de echo een meisje is: zet hieronder "meisje" in plaats van "jongen".
// Daarna gaat de site ná de crawl meteen naar de meisjes-pagina.
window.GENDER_REVEAL = "jongen";

// Tijdelijk: afteller uit zodat de crawl direct te starten is.
// Zet op false vóór het echte reveal-moment (19 september 2026).
window.SKIP_COUNTDOWN = true;

// Officieel reveal-moment (Europe/Amsterdam, incl. zomertijd).
window.REVEAL_AT = {
  year: 2026,
  month: 9,
  day: 19,
  hour: 12,
  minute: 30,
  second: 0,
  timeZone: "Europe/Amsterdam",
};
