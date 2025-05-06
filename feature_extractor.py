import pandas as pd
import os
import time
import random
from urllib.parse import urlparse
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from tqdm import tqdm
import concurrent.futures
import threading
import csv
from queue import Queue
import signal
import sys


# Thread-safe CSV writer
class SafeCSVWriter:
    def __init__(self, filename, fieldnames):
        self.filename = filename
        self.fieldnames = fieldnames
        self.lock = threading.Lock()

        # Initialize the file if it doesn't exist
        if not os.path.exists(filename):
            with open(filename, 'w', newline='') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()

    def write_row(self, row_dict):
        with self.lock:
            with open(self.filename, 'a', newline='') as f:
                writer = csv.DictWriter(f, fieldnames=self.fieldnames)
                writer.writerow(row_dict)


# Thread-safe set for tracking processed URLs
class SafeSet:
    def __init__(self, initial_set=None):
        self.data = set(initial_set) if initial_set else set()
        self.lock = threading.Lock()

    def add(self, item):
        with self.lock:
            self.data.add(item)

    def __contains__(self, item):
        with self.lock:
            return item in self.data

    def __len__(self):
        with self.lock:
            return len(self.data)


def setup_driver():
    options = Options()
    options.add_argument('--headless=new')  # newer, more reliable headless mode
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-gpu')  # helps prevent crashes
    options.add_argument('--disable-extensions')
    options.add_argument('--disable-dev-shm-usage')

    # Block images, CSS, notifications
    prefs = {
        "profile.managed_default_content_settings.images": 2,
        "profile.managed_default_content_settings.stylesheets": 2,
        "profile.default_content_setting_values.notifications": 2
    }
    options.add_experimental_option("prefs", prefs)

    return webdriver.Chrome(options=options)


def extract_features_for_url(url: str, label: str):
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
        # print(f"Error processing {url}: {str(e)}")
        return None


def worker(url_queue, csv_writer, seen_urls, pbar):
    """Worker function to process URLs from the queue"""
    while True:
        url_data = url_queue.get()
        if url_data is None:  # Poison pill to terminate
            break

        url, label = url_data

        if url in seen_urls:
            url_queue.task_done()
            continue

        features = extract_features_for_url(url, label)
        if features:
            csv_writer.write_row(features)
            seen_urls.add(url)
            pbar.update(1)

        url_queue.task_done()


def setup_graceful_exit(pbar):
    """Set up signal handlers for graceful exit"""

    def signal_handler(sig, frame):
        print("\nStopping gracefully. Please wait for current operations to finish...")
        pbar.close()
        sys.exit(0)

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)


def main():
    source_csv = './URL-improved dataset.csv'
    output_csv = "dom_features.csv"
    total_needed = 80000
    num_workers = min(32, os.cpu_count() * 2)  # Number of parallel workers

    print(f"Starting with {num_workers} parallel workers")

    # Define fieldnames for CSV
    fieldnames = ['url', 'type', 'forms', 'inputs', 'iframes', 'scripts', 'images',
                  'buttons', 'domDepth', 'maxChildren', 'titleLength', 'onmouseoverEvents',
                  'externalResourceRatio', 'inlineStyles', 'phishingKeywordHits', 'usesHTTPS', 'hasEval']

    # Load source dataset
    source_df = pd.read_csv(source_csv)

    # Initialize thread-safe CSV writer
    csv_writer = SafeCSVWriter(output_csv, fieldnames)

    # Load already processed URLs
    seen_urls = SafeSet()
    if os.path.exists(output_csv):
        processed_df = pd.read_csv(output_csv)
        for url in processed_df['url']:
            seen_urls.add(url)

    # Create a progress bar
    remaining = total_needed - len(seen_urls)
    pbar = tqdm(total=remaining, desc="Processing URLs")

    # Set up graceful exit
    setup_graceful_exit(pbar)

    # Create a queue to hold URLs to process
    url_queue = Queue()

    # Start worker threads
    threads = []
    for i in range(num_workers):
        t = threading.Thread(
            target=worker,
            args=(url_queue, csv_writer, seen_urls, pbar),
            daemon=True
        )
        t.start()
        threads.append(t)

    # Shuffle the dataset to avoid hitting the same domains repeatedly
    shuffled_indices = list(range(len(source_df)))
    random.shuffle(shuffled_indices)

    # Feed URLs into the queue
    try:
        while len(seen_urls) < total_needed:
            for idx in shuffled_indices:
                if len(seen_urls) >= total_needed:
                    break

                row = source_df.iloc[idx]
                url, label = row['url'], row['type']
                if row['type'] == 'legitimate':
                    break
                if url not in seen_urls:
                    url_queue.put((url, label))

            # If we've gone through all URLs but still need more, reshuffle
            if len(seen_urls) < total_needed:
                random.shuffle(shuffled_indices)
                # Wait a bit to avoid tight loop
                time.sleep(1)
    except KeyboardInterrupt:
        print("\nInterrupted. Waiting for threads to finish current work...")
    finally:
        # Wait for the queue to be empty
        url_queue.join()

        # Send poison pills to all workers
        for _ in range(num_workers):
            url_queue.put(None)

        # Wait for all threads to finish
        for t in threads:
            t.join()

        pbar.close()
        print(f"Completed: {len(seen_urls)} URLs processed.")


if __name__ == "__main__":
    main()