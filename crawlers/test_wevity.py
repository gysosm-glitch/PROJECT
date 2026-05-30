import requests
from bs4 import BeautifulSoup

def test_wevity():
    base_url = 'https://www.wevity.com'
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    }
    
    with open('crawlers/wevity_output.txt', 'w', encoding='utf-8') as f:
        for page in range(1, 4):
            url = f'{base_url}/?c=find&s=1&gub=1&sGub=1&cate=1&page={page}'
            resp = requests.get(url, headers=headers)
            soup = BeautifulSoup(resp.text, 'lxml')
            items = soup.select('ul.list li')
            
            for item in items:
                if 'top' in item.get('class', []):
                    continue
                title_el = item.select_one('div.tit a')
                if not title_el: continue
                
                title_a = BeautifulSoup(str(title_el), 'lxml').find('a')
                span = title_a.find('span')
                if span: span.decompose()
                title = title_a.get_text(strip=True)
                
                org_el = item.select_one('div.organ')
                organizer = org_el.get_text(strip=True) if org_el else "NONE"
                
                f.write(f"Title: {title}\nOrganizer: {organizer}\n\n")

if __name__ == '__main__':
    test_wevity()
