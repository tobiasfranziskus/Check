"""Dev-only: python tests/legacy-pilot-touch.py (installed Playwright + Chromium).
Starts a temporary local static server; never opens product saves.
"""
import functools
import http.server
import json
import pathlib
import threading
from playwright.sync_api import sync_playwright

repo = pathlib.Path(__file__).resolve().parents[1]
class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass
server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(QuietHandler, directory=str(repo)))
threading.Thread(target=server.serve_forever, daemon=True).start()
results = []
try:
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
        for width, height in [(1180,820), (1024,768), (820,1180), (390,844)]:
            context = browser.new_context(viewport={'width':width,'height':height}, has_touch=True, is_mobile=True, device_scale_factor=1)
            page = context.new_page()
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.goto(f'http://127.0.0.1:{server.server_port}/prototypes/legacy-pilot/')
            page.evaluate('window.before = JSON.stringify(LegacyPilotExamples)')
            for pilot in range(4):
                page.select_option('#pilot-choice', str(pilot))
                assert page.locator('.lp h1').inner_text() == ['Mara Voss','Ivo Kern','Nela Arendt','Tarek Holm'][pilot]
                for skill, status in [('mining','Freigeschaltet'),('survey','Gesperrt'),('navigation','Noch nicht bewertbar')]:
                    card = page.locator(f'[data-skill="{skill}"]')
                    card.tap()
                    assert card.get_attribute('aria-pressed') == 'true'
                    assert status in page.locator('.lp-detail').inner_text()
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
            page.locator('[data-skill="combat"]').tap()
            page.locator('[data-skill="combat"]').focus()
            page.evaluate('pilotPreview.update({...LegacyPilotExamples[3], revision:"UPDATE"})')
            assert page.locator('[data-skill="combat"]').get_attribute('aria-pressed') == 'true'
            assert page.evaluate('document.activeElement.dataset.skill') == 'combat'
            assert 'UPDATE' in page.locator('.lp-footer').inner_text()
            assert page.evaluate('JSON.stringify(LegacyPilotExamples) === before')
            assert page.locator('.lp-card').evaluate_all('(nodes)=>nodes.every(n=>n.getBoundingClientRect().height>=48)')
            assert page.locator('select').bounding_box()['height'] >= 48
            page.evaluate('pilotPreview.update({pilot:{id:"attack",name:"<img src=x onerror=alert(1)>"},skills:[{id:"a",name:"<script>bad()</script>"}]})')
            page.locator('[data-skill="a"]').tap()
            assert page.locator('.lp img,.lp script').count() == 0
            assert 'Noch nicht bewertbar' in page.locator('.lp-detail').inner_text()
            page.evaluate('pilotPreview.update(LegacyPilotExamples[3])')
            page.locator('[data-skill="survey"]').tap()
            page.locator('.lp').screenshot(path=f'/tmp/legacy-pilot-{width}x{height}.png')
            assert not errors, errors
            page.evaluate('pilotPreview.destroy(); pilotPreview.update({})')
            assert page.locator('#pilot-root').inner_text() == ''
            results.append({'size':f'{width}x{height}','touch':True,'result':'passed'})
            context.close()
        browser.close()
finally:
    server.shutdown()
print(json.dumps(results, indent=2))
