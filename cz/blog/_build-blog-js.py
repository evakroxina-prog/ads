import json
import re
from pathlib import Path

root = Path(__file__).resolve().parents[2]
src = (root / "blog" / "blog.js").read_text(encoding="utf-8")
articles = json.loads((root / "cz" / "blog" / "articles.json").read_text(encoding="utf-8"))
for a in articles:
    a.pop("ruSlug", None)
articles_js = json.dumps(articles, ensure_ascii=False, indent=2)
src = re.sub(r"var ARTICLES = \[.*?\];", "var ARTICLES = " + articles_js + ";", src, count=1, flags=re.S)

replacements = [
    ("M:E blog.js v20260703b", "M:E blog.js cs v20260707"),
    ("MONTHS_RU", "MONTHS_CS"),
    (
        '"января", "февраля", "марта", "апреля", "мая", "июня",\n    "июля", "августа", "сентября", "октября", "ноября", "декабря"',
        '"ledna", "února", "března", "dubna", "května", "června",\n    "července", "srpna", "září", "října", "listopadu", "prosince"',
    ),
    ("formatDateRu", "formatDateCs"),
    ('href="/blog/', 'href="/cz/blog/'),
    ('"/blog/?tag=', '"/cz/blog/?tag='),
    (
        'window.location.href = tag ? "/blog/?tag=" + encodeURIComponent(tag) : "/blog/";',
        'window.location.href = tag ? "/cz/blog/?tag=" + encodeURIComponent(tag) : "/cz/blog/";',
    ),
    ('localeCompare(b, "ru")', 'localeCompare(b, "cs")'),
    ("Читать →", "Číst →"),
    ("По этой теме пока нет опубликованных статей.", "K tomuto tématu zatím nejsou publikované články."),
    ("Показаны статьи с тегом", "Zobrazeny články s tagem"),
    ("Показать все", "Zobrazit vše"),
    ("Фильтр по темам", "Filtr podle témat"),
    ('" data-tag="">Все ', '" data-tag="">Vše '),
    ("Видео к этой статье скоро появится", "Video k tomuto článku brzy přibude"),
    ("Подпишитесь на", "Odebírejte"),
    ("чтобы не пропустить", "ať vám nic neuteče"),
    ("Смотреть видео", "Přehrát video"),
    ("Видео M:E Agency", "Video M:E Agency"),
    ('aria-label="Файлы cookie"', 'aria-label="Soubory cookie"'),
    ("Мы используем файлы cookie", "Používáme soubory cookie"),
    ("Нажимая «Принять»", 'Kliknutím na „Přijmout“'),
    ("вы соглашаетесь на их использование.", "souhlasíte s jejich použitím."),
    ("Политика cookie", "Zásady cookies"),
    ("Отклонить", "Odmítnout"),
    ("Принять", "Přijmout"),
    ("Поделиться статьёй", "Sdílet článek"),
    ("Была полезна статья?", "Byl článek užitečný?"),
    ("Спасибо за ответ!", "Děkujeme za odpověď!"),
    ("Не хватило деталей?", "Chyběly detaily?"),
    ("Напишите нам", "Napište nám"),
    ("подскажем.", "poradíme."),
    ("Скопировать ссылку", "Kopírovat odkaz"),
    ("Поделиться через приложение", "Sdílet přes aplikaci"),
    ("Ссылка скопирована", "Odkaz zkopírován"),
    ("Не удалось скопировать", "Nepodařilo se zkopírovat"),
    ("Скопировать", "Kopírovat"),
    ("Отправка…", "Odesílání…"),
    (
        "Не удалось отправить. Попробуйте позже или напишите на ads@marketexpert.cz",
        "Odeslání se nezdařilo. Zkuste to později nebo napište na ads@marketexpert.cz",
    ),
    ("https://ads.marketexpert.cz/#order", "https://ads.marketexpert.cz/cz/#order"),
    ("https://ads.marketexpert.cz/#pricing", "https://ads.marketexpert.cz/cz/#pricing"),
    ("https://ads.marketexpert.cz/#audit", "https://ads.marketexpert.cz/cz/#order"),
    ('window.location.pathname || "/blog/"', 'window.location.pathname || "/cz/blog/"'),
]
for old, new in replacements:
    src = src.replace(old, new)

# Feedback buttons: replace after generic Да/Нет would break other things - do targeted
src = src.replace('data-helpful="yes">Да</button>', 'data-helpful="yes">Ano</button>')
src = src.replace('data-helpful="no">Нет</button>', 'data-helpful="no">Ne</button>')
src = src.replace('title="Поделиться" aria-label="Поделиться"', 'title="Sdílet" aria-label="Sdílet"')

# Remove checklist handler (no Czech PDF yet)
src = re.sub(r"\n  /\* --- Чек-лист \(Formspree \+ PDF\) --- \*/.*", "\n})(", src, flags=re.S)

out = root / "cz" / "blog" / "blog.js"
out.write_text(src, encoding="utf-8")
print("written", out, "bytes", out.stat().st_size)
