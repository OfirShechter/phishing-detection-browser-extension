import pandas as pd
import time
from urllib.parse import urlparse
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from multiprocessing import Pool, cpu_count

from tqdm import tqdm


def setup_driver():
    options = Options()
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    return webdriver.Chrome(options=options)


def extract_features_for_url(row):
    url, label = row['url'], row['type']
    features = {
        'url': url,
        'type': label,
        'forms': 0, 'inputs': 0, 'iframes': 0, 'scripts': 0, 'images': 0,
        'buttons': 0, 'domDepth': 0, 'maxChildren': 0, 'titleLength': 0,
        'onmouseoverEvents': 0, 'externalResourceRatio': 0,
        'inlineStyles': 0, 'phishingKeywordHits': 0, 'usesHTTPS': url.startswith('https'), 'hasEval': 0
    }

    def get_dom_depth(soup, max_depth=50):
        def depth(el, current_depth=0):
            if current_depth >= max_depth or not hasattr(el, 'contents'):
                return 1
            child_depths = [
                depth(c, current_depth + 1)
                for c in el.contents
                if hasattr(c, 'contents')
            ]
            return 1 + (max(child_depths) if child_depths else 0)

        return depth(soup)

    def get_max_children(soup):
        tag_list = soup.find_all()
        return max((len(tag.find_all(recursive=False)) for tag in tag_list), default=0)

    def get_external_resource_ratio(soup, hostname):
        resources = soup.find_all(['script', 'img', 'link'])
        external = sum(1 for tag in resources if (src := tag.get('src') or tag.get('href')) and hostname not in src)
        return external / len(resources) if resources else 0

    def get_phishing_keywords_count(text):
        return sum(text.count(k) for k in ['verify', 'account', 'login', 'password', 'secure', 'update'])

    try:
        driver = setup_driver()
        driver.set_page_load_timeout(10)
        driver.get(url)
        time.sleep(2)

        soup = BeautifulSoup(driver.page_source, 'html.parser')
        hostname = urlparse(url).hostname or ""
        body_text = soup.get_text().lower()

        features.update({
            'forms': len(soup.find_all('form')),
            'inputs': len(soup.find_all('input')),
            'iframes': len(soup.find_all('iframe')),
            'scripts': len(soup.find_all('script')),
            'images': len(soup.find_all('img')),
            'buttons': len(soup.find_all('button')),
            'domDepth': get_dom_depth(soup),
            'maxChildren': get_max_children(soup),
            'titleLength': len(soup.title.string) if soup.title and soup.title.string else 0,
            'onmouseoverEvents': len(soup.select('[onmouseover]')),
            'externalResourceRatio': get_external_resource_ratio(soup, hostname),
            'inlineStyles': len(soup.select('[style]')),
            'phishingKeywordHits': get_phishing_keywords_count(body_text),
            'hasEval': int(any('eval' in s.text for s in soup.find_all('script')))
        })

        driver.quit()
        return features
    except Exception as e:
        return None


if __name__ == "__main__":
    df = pd.read_csv('./URL-improved dataset.csv')
    records = df.sample(50000).to_dict(orient="records")

    results = []
    print("Starting multiprocessing scrape...")
    with Pool(processes=min(cpu_count(), 8)) as pool:
        for result in tqdm(pool.imap_unordered(extract_features_for_url, records), total=len(records)):
            results.append(result)

    clean_results = [r for r in results if r is not None]
    print(f"Filtered out {len(results) - len(clean_results)} failed URLs out of {len(results)} total.")

    features_df = pd.DataFrame(clean_results)
    features_df.to_csv("dom_features.csv", index=False)
