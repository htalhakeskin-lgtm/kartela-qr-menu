# Rakım yazı tipleri (Türkçe alt küme)

Plan §11.3, K-37, K-46. Google Fonts'un `latin` + `latin-ext` dosyaları yerine yalnızca Türkçe metnin kullandığı karakterleri taşıyan tek dosya: Schibsted Grotesk 67,7 KB → 37,9 KB, IBM Plex Mono 500 → 12,6 KB.

| Dosya | Kaynak | Lisans |
|---|---|---|
| `schibsted-grotesk-tr.woff2` | [google/fonts `ofl/schibstedgrotesk/SchibstedGrotesk[wght].ttf`](https://github.com/google/fonts/tree/main/ofl/schibstedgrotesk), ağırlık ekseni 400–700'e kısıtlı | SIL OFL 1.1 (`OFL-schibsted-grotesk.txt`) |
| `plex-mono-500-tr.woff2` | [google/fonts `ofl/ibmplexmono/IBMPlexMono-Medium.ttf`](https://github.com/google/fonts/tree/main/ofl/ibmplexmono) | SIL OFL 1.1 (`OFL-ibm-plex-mono.txt`) |

Karakterler: Temel Latin, Latin-1 (Ç Ö Ü â î û ° · « » ×), Ğ ğ İ ı Ş ş, tireler, tırnaklar, `…`, `→`, `−`, ince ve bölünmez boşluklar; Plex Mono'da ayrıca `₺`. Arapça yok (Rakım TR + EN).

**`₺` Grotesk'te yok, bilerek:** Schibsted Grotesk'in U+20BA glifi Türk lirası işareti değil, eski lira işareti ₤ (iki çizgili £) gibi çizilmiş (Google'ın dosyasında da öyle). Grotesk'le yazılan metindeki `₺` sistem yazı tipinden doğru biçimiyle gelir; fiyatlar zaten Plex Mono'da (plan §11.3), onun glifi doğru.

Yeniden üretmek (Python, `pip install fonttools brotli`):

```sh
U="U+0020-007E,U+00A0-00FF,U+011E-011F,U+0130-0131,U+015E-015F,U+2009,U+2013-2014,U+2018-201A,U+201C-201E,U+2022,U+2026,U+202F,U+2032-2033,U+20BA,U+2192,U+2212"
python -m fontTools.varLib.instancer "SchibstedGrotesk[wght].ttf" wght=400:700 -o grotesk-400-700.ttf
python -m fontTools.subset grotesk-400-700.ttf --unicodes="${U/,U+20BA/}" --layout-features='kern,liga,calt,tnum,case,locl' --flavor=woff2 --output-file=schibsted-grotesk-tr.woff2
python -m fontTools.subset IBMPlexMono-Medium.ttf --unicodes="$U" --layout-features='kern,liga,calt,tnum,zero,locl' --flavor=woff2 --output-file=plex-mono-500-tr.woff2
```

Menüye alt kümede olmayan bir karakter girerse (ör. başka bir alfabe) tarayıcı o harfi yedek yazı tipinden çizer; sayfa bozulmaz.
