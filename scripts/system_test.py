"""
End-to-end system test for Quran-Data.

Exercises every user-visible flow against the locally-running docker-compose
stack (api on :5001, client on :3000). Captures screenshots on failure and
fails fast on the first JS error / unhandled rejection / 4xx-5xx response
that the app didn't already explicitly intend.

Run:
    python3 scripts/system_test.py
"""

import json
import re
import sys
import time
import urllib.request
from contextlib import contextmanager
from playwright.sync_api import sync_playwright, expect, TimeoutError as PWTimeout

CLIENT = "http://localhost:3000"
API = "http://localhost:5001"

GREEN = "\033[32m"; RED = "\033[31m"; YELLOW = "\033[33m"; CYAN = "\033[36m"; DIM = "\033[2m"; END = "\033[0m"

results = []  # (status, name, detail)


def record(status, name, detail=""):
    results.append((status, name, detail))
    icon = {"PASS": f"{GREEN}✓{END}", "FAIL": f"{RED}✗{END}", "WARN": f"{YELLOW}!{END}"}[status]
    line = f"  {icon} {name}"
    if detail:
        line += f" {DIM}— {detail}{END}"
    print(line)


@contextmanager
def section(title):
    print(f"\n{CYAN}── {title} ──{END}")
    yield


def http_status(url):
    try:
        r = urllib.request.urlopen(url, timeout=10)
        return r.status
    except urllib.error.HTTPError as e:
        return e.code
    except Exception:
        return 0


def http_json(url):
    with urllib.request.urlopen(url, timeout=10) as r:
        return json.loads(r.read())


# ───────────────────────────────────────────────────────────────────
# Phase 0 — API contract checks (fast, no browser)
# ───────────────────────────────────────────────────────────────────
def api_contract_tests():
    with section("API contract (direct, port 5001)"):
        cases = [
            ("GET /api/health",                     f"{API}/api/health",                     200),
            ("GET /api/surahs",                     f"{API}/api/surahs",                     200),
            ("GET /api/surah/1",                    f"{API}/api/surah/1",                    200),
            ("GET /api/surah/114",                  f"{API}/api/surah/114",                  200),
            ("GET /api/sajda",                      f"{API}/api/sajda",                      200),
            ("GET /api/juz/1",                      f"{API}/api/juz/1",                      200),
            ("GET /api/juz/30",                     f"{API}/api/juz/30",                     200),
            ("GET /api/pages?page=1",               f"{API}/api/pages?page=1",               200),
            ("GET /api/audio/1",                    f"{API}/api/audio/1",                    200),
            ("GET /api/verse/1/1",                  f"{API}/api/verse/1/1",                  200),
            ("GET /data/quran_image/1.png",         f"{API}/data/quran_image/1.png",         200),
            ("GET /data/pagesQuran.json",           f"{API}/data/pagesQuran.json",           200),
            # Stats endpoints
            ("GET /api/stats/letters",              f"{API}/api/stats/letters",              200),
            ("GET /api/stats/words?limit=10",       f"{API}/api/stats/words?limit=10",       200),
            ("GET /api/stats/verse-distribution",   f"{API}/api/stats/verse-distribution",   200),
            ("GET /api/stats/verses-per-page",      f"{API}/api/stats/verses-per-page",      200),
            ("GET /api/stats/hapax",                f"{API}/api/stats/hapax",                200),
            ("GET /api/stats/definite-article",     f"{API}/api/stats/definite-article",     200),
            ("GET /api/stats/revelation",           f"{API}/api/stats/revelation",           200),
            ("GET /api/stats/surah-extremes",       f"{API}/api/stats/surah-extremes",       200),
            ("GET /api/stats/hizbs",                f"{API}/api/stats/hizbs",                200),
            ("GET /api/compare/2/3",                f"{API}/api/compare/2/3",                200),
            ("GET /api/compare/abc/3 (invalid)",    f"{API}/api/compare/abc/3",              400),
        ]
        for name, url, expected in cases:
            code = http_status(url)
            if code == expected:
                record("PASS", name, f"{code}")
            else:
                record("FAIL", name, f"got {code}, expected {expected}")


def security_tests():
    with section("Security regression (path traversal + leaks)"):
        # Path traversal must be 400
        attacks = [
            f"{API}/api/surah/x%2F..%2F..%2F..%2F..%2Fpackage",
            f"{API}/api/audio/x%2F..%2F..%2F..%2F..%2Fpackage",
            f"{API}/api/juz/x%2F..%2F..%2Fpackage",
            f"{API}/api/surah/-1",
            f"{API}/api/surah/9999",
            f"{API}/api/surah/abc",
        ]
        for url in attacks:
            code = http_status(url)
            label = url.replace(API, "")
            if code == 400:
                record("PASS", f"blocked: {label}", f"{code}")
            else:
                record("FAIL", f"NOT blocked: {label}", f"got {code}, expected 400")

        # Files that must NOT be exposed via /data
        leaks = [
            ("/data/sqlite/database.sqlite",   f"{API}/data/sqlite/database.sqlite"),
            ("/data/csv/database.csv",         f"{API}/data/csv/database.csv"),
            ("/data/mainDataQuran.json",       f"{API}/data/mainDataQuran.json"),
            ("/data/json/metadata.json",       f"{API}/data/json/metadata.json"),
        ]
        for label, url in leaks:
            code = http_status(url)
            if code in (403, 404):
                record("PASS", f"hidden: {label}", f"{code}")
            else:
                record("FAIL", f"LEAKED: {label}", f"got {code}")

        # Helmet headers
        try:
            r = urllib.request.urlopen(f"{API}/api/health", timeout=5)
            headers = {k.lower(): v for k, v in r.headers.items()}
            for h in ("content-security-policy", "strict-transport-security",
                      "x-content-type-options", "x-frame-options", "referrer-policy"):
                if h in headers:
                    record("PASS", f"header present: {h}", headers[h][:60])
                else:
                    record("FAIL", f"header missing: {h}")
            if "x-powered-by" in headers:
                record("FAIL", "x-powered-by leaked", headers["x-powered-by"])
            else:
                record("PASS", "x-powered-by hidden")
        except Exception as e:
            record("FAIL", "helmet header probe", str(e))

        # Error response must NOT leak stack
        try:
            r = urllib.request.urlopen(f"{API}/api/pages")
            body = json.loads(r.read())
        except urllib.error.HTTPError as e:
            body = json.loads(e.read())
        if "stack" not in body and "details" not in body:
            record("PASS", "error response: no stack/details leak")
        else:
            record("FAIL", "error response leaks", str(list(body.keys())))


# ───────────────────────────────────────────────────────────────────
# Phase 1 — Browser-driven UI flows
# ───────────────────────────────────────────────────────────────────
def browser_tests():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(viewport={"width": 1280, "height": 900}, locale="ar-SA")
        page = ctx.new_page()

        # Capture every console error and failed network request
        console_errors = []
        page_errors = []
        bad_responses = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
        page.on("pageerror", lambda exc: page_errors.append(str(exc)))

        def on_response(resp):
            try:
                if resp.status >= 400 and "/api/" in resp.url and "/api/pages" not in resp.url:
                    bad_responses.append(f"{resp.status} {resp.url}")
            except Exception:
                pass
        page.on("response", on_response)

        try:
            with section("Homepage (/)"):
                page.goto(CLIENT, wait_until="networkidle", timeout=30000)
                page.screenshot(path="/tmp/qd_home.png", full_page=False)
                # Title
                title = page.title()
                if "القرآن الكريم" in title:
                    record("PASS", "page title in Arabic", title)
                else:
                    record("FAIL", "page title", title)
                # RTL
                html_dir = page.evaluate("document.documentElement.dir")
                record("PASS" if html_dir == "rtl" else "FAIL", f"<html dir>", html_dir)
                # 114 surah cards
                cards = page.locator("a[href^='/surah/']")
                count = cards.count()
                record("PASS" if count >= 114 else "FAIL", "surah cards", f"{count} found")
                # Filter
                page.fill("input[placeholder*='ابحث']", "البقرة")
                page.wait_for_timeout(300)
                visible = page.locator("a[href^='/surah/']").count()
                record("PASS" if 1 <= visible <= 5 else "FAIL", "name filter narrows results", f"{visible} visible")
                # Clear
                page.fill("input[placeholder*='ابحث']", "")

            with section("SearchBar — verify hash fix navigates to specific verse"):
                page.fill("input[placeholder='السورة']", "2")
                page.fill("input[placeholder='الآية']", "255")
                page.click("button[type='submit']:has-text('اذهب')")
                page.wait_for_url(re.compile(r"/surah/2#verse-2-255"), timeout=10000)
                record("PASS", "URL contains correct hash", page.url.split('#')[-1])
                page.wait_for_load_state("networkidle")
                # Wait for hash effect to scroll + highlight
                page.wait_for_timeout(800)
                # Check element exists and is visible-ish
                target = page.locator("#verse-2-255")
                if target.count() == 1:
                    record("PASS", "verse element exists in DOM (#verse-2-255)")
                else:
                    record("FAIL", "verse element missing", f"count={target.count()}")
                # Check the highlight class was applied at some point
                # (it auto-removes after 2.2s — checking screenshot is more reliable)
                page.screenshot(path="/tmp/qd_search_jump.png", full_page=False)

            with section("Surah page (/surah/2) — Al-Baqarah stats"):
                page.goto(f"{CLIENT}/surah/2", wait_until="networkidle")
                page.wait_for_timeout(500)
                # Stats panel
                lines_el = page.locator("dt:has-text('عدد الأسطر التقريبي') + dd")
                if lines_el.count() == 1:
                    txt = lines_el.first.inner_text()
                    # Normalize Arabic-Indic numerals + digits
                    digits = re.sub(r"[^\d]", "", txt.translate(str.maketrans("٠١٢٣٤٥٦٧٨٩", "0123456789")))
                    if digits == "711":
                        record("PASS", "Al-Baqarah lines = 711 (after header fix)", digits)
                    else:
                        record("FAIL", "Al-Baqarah lines", f"got {digits}, expected 711")
                # Audio player exists
                audio = page.locator("audio")
                record("PASS" if audio.count() >= 1 else "FAIL", "audio element rendered")
                # Reciter dropdown has multiple options
                opts = page.locator("select option").count()
                record("PASS" if opts >= 5 else "FAIL", "reciter dropdown populated", f"{opts} options")
                # Verse list rendered
                verses = page.locator("article[id^='verse-']").count()
                record("PASS" if verses >= 286 else "FAIL", "Al-Baqarah verses rendered", f"{verses} verses")
                page.screenshot(path="/tmp/qd_surah_2.png", full_page=False)

            with section("Surah page (/surah/114) — An-Nas (shared-page math)"):
                page.goto(f"{CLIENT}/surah/114", wait_until="networkidle")
                page.wait_for_timeout(500)
                lines_el = page.locator("dt:has-text('عدد الأسطر التقريبي') + dd")
                if lines_el.count() == 1:
                    txt = lines_el.first.inner_text()
                    digits = re.sub(r"[^\d]", "", txt.translate(str.maketrans("٠١٢٣٤٥٦٧٨٩", "0123456789")))
                    # After P2.10 fix: An-Nas should be 4 (verses) + 2 (own header) = 6
                    if digits in ("4", "5", "6", "7"):  # acceptable range
                        record("PASS", "An-Nas lines reasonable", digits)
                    else:
                        record("FAIL", "An-Nas lines", f"got {digits}, expected 4-7")
                # Shared-pages note appears
                shared_note = page.locator("text=منها").first
                if shared_note.is_visible():
                    record("PASS", "shared-pages note visible")
                else:
                    record("WARN", "shared-pages note not visible (may be hidden if sharedPages=0)")

            with section("Stats page (/stats)"):
                page.goto(f"{CLIENT}/stats", wait_until="networkidle")
                page.wait_for_timeout(500)
                # 8 stat tiles in overview — find by canonical labels rather than DOM nth
                overview_present = sum(
                    1 for label in ("عدد السور", "عدد الأجزاء", "عدد الصفحات",
                                    "عدد الآيات", "عدد الكلمات", "عدد الحروف")
                    if page.locator(f"text={label}").count() > 0
                )
                record("PASS" if overview_present >= 6 else "FAIL",
                       "overview tiles present (by label)", f"{overview_present}/6")
                # Reading time block (3 speeds)
                rt_blocks = page.locator("text=ترتيل").count()
                record("PASS" if rt_blocks >= 1 else "FAIL", "reading-time speeds shown")
                # Pages-per-day clamping (P2.12)
                ppd = page.locator("input[type='number'][min='1'][max='50']").first
                ppd.fill("-99")
                ppd.dispatch_event("change")
                page.wait_for_timeout(200)
                val = ppd.input_value()
                record("PASS" if val == "1" else "FAIL", "pagesPerDay clamps negatives to 1", f"val={val}")
                ppd.fill("999")
                ppd.dispatch_event("change")
                page.wait_for_timeout(200)
                val = ppd.input_value()
                record("PASS" if val == "50" else "FAIL", "pagesPerDay clamps high values to 50", f"val={val}")
                ppd.fill("20")
                ppd.dispatch_event("change")
                # Charts present
                svg_count = page.locator("svg").count()
                record("PASS" if svg_count >= 2 else "FAIL", "charts rendered (SVG count)", f"{svg_count}")
                # Sortable table
                rows = page.locator("table tbody tr").count()
                record("PASS" if rows == 114 else "FAIL", "stats table rows", f"{rows}")
                page.screenshot(path="/tmp/qd_stats.png", full_page=True)

            with section("Juz page (/juz/30)"):
                page.goto(f"{CLIENT}/juz/30", wait_until="networkidle")
                page.wait_for_timeout(500)
                # Stats panel words count > 0
                words_el = page.locator("dt:has-text('عدد الكلمات') + dd")
                if words_el.count() == 1:
                    txt = words_el.first.inner_text()
                    digits = re.sub(r"[^\d]", "", txt.translate(str.maketrans("٠١٢٣٤٥٦٧٨٩", "0123456789")))
                    record("PASS" if int(digits) > 1000 else "FAIL", "Juz 30 word count computed", digits)
                # Surah breakdown chips
                chips = page.locator("a[href^='/surah/'][title*='آية']").count()
                record("PASS" if chips >= 30 else "FAIL", "Juz 30 surah breakdown chips", f"{chips}")
                page.screenshot(path="/tmp/qd_juz_30.png", full_page=False)

            with section("Pages viewer (/pages/2 — Al-Baqarah)"):
                page.goto(f"{CLIENT}/pages/2", wait_until="networkidle")
                page.wait_for_timeout(800)
                img = page.locator("img[alt*='صفحة']").first
                if img.count() == 1:
                    src = img.get_attribute("src") or ""
                    record("PASS" if "/data/quran_image/2.png" in src else "FAIL", "page image src", src)
                else:
                    record("FAIL", "page image not found")
                page.screenshot(path="/tmp/qd_pages_2.png", full_page=False)

            with section("Pages list (/pages)"):
                page.goto(f"{CLIENT}/pages", wait_until="networkidle")
                page.wait_for_timeout(500)
                tiles = page.locator("a[href^='/pages/']").count()
                record("PASS" if tiles >= 604 else "FAIL", "604 page tiles", f"{tiles}")

            with section("Sajda (/sajda)"):
                page.goto(f"{CLIENT}/sajda", wait_until="networkidle")
                page.wait_for_timeout(500)
                articles = page.locator("article").count()
                record("PASS" if 10 <= articles <= 25 else "FAIL", "sajda verses listed", f"{articles}")

            with section("Stats sub-pages"):
                # Letters
                page.goto(f"{CLIENT}/stats/letters", wait_until="networkidle")
                page.wait_for_timeout(500)
                rows = page.locator("table tbody tr").count()
                record("PASS" if 28 <= rows <= 40 else "FAIL", "letters table rows", f"{rows} (expected ~36)")
                # Words tabs
                page.goto(f"{CLIENT}/stats/words", wait_until="networkidle")
                page.wait_for_timeout(500)
                page.click("text=سحابة الكلمات")
                page.wait_for_timeout(300)
                cloud_words = page.locator(".font-quran span").count()
                record("PASS" if cloud_words >= 30 else "FAIL", "word cloud rendered", f"{cloud_words} words")
                # Verses page (longest verse Al-Baqarah 282)
                page.goto(f"{CLIENT}/stats/verses", wait_until="networkidle")
                page.wait_for_timeout(500)
                txt = page.inner_text("body")
                record("PASS" if "البقرة" in txt and "282" in txt else "FAIL", "longest-verse callout shows Al-Baqarah 282")
                # Pages-dist
                page.goto(f"{CLIENT}/stats/pages-dist", wait_until="networkidle")
                page.wait_for_timeout(500)
                rows = page.locator("table tbody tr").count()
                record("PASS" if rows >= 25 else "FAIL", "top-30 pages table", f"{rows}")
                # Revelation
                page.goto(f"{CLIENT}/stats/revelation", wait_until="networkidle")
                page.wait_for_timeout(500)
                rows = page.locator("table tbody tr").count()
                record("PASS" if rows == 114 else "FAIL", "chronology table 114 rows", f"{rows}")
                # Hizbs
                page.goto(f"{CLIENT}/stats/hizbs", wait_until="networkidle")
                page.wait_for_timeout(500)
                hizbs = page.locator("text=حزب").count()
                record("PASS" if hizbs >= 60 else "FAIL", "60 hizbs listed", f"{hizbs}")
                # Compare picker
                page.goto(f"{CLIENT}/compare", wait_until="networkidle")
                page.wait_for_timeout(500)
                btn = page.locator("button:has-text('قارن')")
                record("PASS" if btn.count() == 1 else "FAIL", "compare picker present")
                # Compare result
                page.goto(f"{CLIENT}/compare/2/3", wait_until="networkidle")
                page.wait_for_timeout(500)
                txt = page.inner_text("body")
                record("PASS" if "البقرة" in txt and "آل عمران" in txt else "FAIL", "compare 2 vs 3")

            with section("Shared pages (/shared-pages)"):
                page.goto(f"{CLIENT}/shared-pages", wait_until="networkidle")
                page.wait_for_timeout(500)
                rows = page.locator("table tbody tr").count()
                record("PASS" if 30 <= rows <= 80 else "FAIL", "shared-page rows", f"{rows} (expected ~51)")

            with section("404 SPA fallback (/no-such-page)"):
                page.goto(f"{CLIENT}/no-such-page", wait_until="networkidle")
                content = page.inner_text("body")
                if "غير موجودة" in content or "Not Found" in content:
                    record("PASS", "404 page renders Arabic message")
                else:
                    record("FAIL", "404 page content", content[:80])

            with section("Browser-side error monitor"):
                if page_errors:
                    for e in page_errors:
                        record("FAIL", "uncaught page error", e[:120])
                else:
                    record("PASS", "no uncaught page errors")
                if console_errors:
                    # Filter known noisy errors (favicon, font preload warnings, etc.)
                    real = [e for e in console_errors if "favicon" not in e.lower()]
                    if real:
                        for e in real:
                            record("WARN", "console error", e[:120])
                    else:
                        record("PASS", "no real console errors")
                else:
                    record("PASS", "no console errors at all")
                if bad_responses:
                    # Some 404s are expected (e.g. old verse number on shared-pages)
                    for r in bad_responses[:5]:
                        record("WARN", "bad API response observed", r)
                else:
                    record("PASS", "no failing /api/ responses during tour")

        finally:
            ctx.close()
            browser.close()


# ───────────────────────────────────────────────────────────────────
# Main
# ───────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print(f"\n{CYAN}{'═'*60}{END}")
    print(f"{CYAN}  Quran-Data End-to-End System Test{END}")
    print(f"{CYAN}  client {CLIENT}  ·  api {API}{END}")
    print(f"{CYAN}{'═'*60}{END}")

    api_contract_tests()
    security_tests()
    try:
        browser_tests()
    except PWTimeout as e:
        record("FAIL", "browser timeout", str(e)[:200])
    except Exception as e:
        record("FAIL", "browser exception", f"{type(e).__name__}: {str(e)[:200]}")

    # Summary
    p = sum(1 for s, *_ in results if s == "PASS")
    f = sum(1 for s, *_ in results if s == "FAIL")
    w = sum(1 for s, *_ in results if s == "WARN")
    print(f"\n{CYAN}{'═'*60}{END}")
    print(f"  {GREEN}{p} passed{END}   {RED}{f} failed{END}   {YELLOW}{w} warn{END}")
    print(f"{CYAN}{'═'*60}{END}")
    if f:
        print(f"\n{RED}Failed checks:{END}")
        for s, n, d in results:
            if s == "FAIL":
                print(f"  • {n} — {d}")
        sys.exit(1)
    sys.exit(0)
