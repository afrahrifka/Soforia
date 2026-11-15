"""Unduh dua paket gratis dari alur download resmi Kenney; tidak menyimpan URL bertanda tangan."""
import http.cookiejar,json,re,urllib.request,zipfile
from pathlib import Path
opener=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
root=Path('artifacts/asset-downloads');root.mkdir(parents=True,exist_ok=True)
for slug,name in [('platformer-kit','platformer'),('nature-kit','nature')]:
 page='https://kenney.nl/assets/'+slug
 html=opener.open(page).read().decode();ident=re.search("data-download-id='([^']+)",html).group(1)
 response=json.loads(opener.open(urllib.request.Request('https://kenney.nl/download-link/'+ident,headers={'Referer':page,'Accept':'application/json'})).read());url=response.get('url') or response.get('link')
 if not url:raise RuntimeError('Download resmi tidak tersedia: '+slug)
 destination=root/(name+'.zip');destination.write_bytes(opener.open(url).read())
 with zipfile.ZipFile(destination) as archive:assert b'CC0' in archive.read('License.txt')
 print('Paket CC0 terunduh dan diperiksa:',name)
