from flask import Flask, render_template, jsonify
import requests
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup
import re

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def parse_feed():
    try:
        response = requests.get(FEED_URL, timeout=10)
        if response.status_code != 200:
            return []
        
        root = ET.fromstring(response.content)
        ns = {'atom': 'http://www.w3.org/2005/Atom'}
        
        updates = []
        for entry in root.findall('atom:entry', ns):
            title_el = entry.find('atom:title', ns)
            updated_el = entry.find('atom:updated', ns)
            link_el = entry.find('atom:link[@rel="alternate"]', ns)
            content_el = entry.find('atom:content', ns)
            
            date_str = title_el.text if title_el is not None else ""
            updated_str = updated_el.text if updated_el is not None else ""
            link_url = link_el.attrib.get('href', '') if link_el is not None else ""
            html_content = content_el.text if content_el is not None else ""
            
            soup = BeautifulSoup(html_content, 'html.parser')
            
            current_type = "Update"
            current_elements = []
            
            # Iterate through children to split multiple updates inside one entry
            for child in soup.contents:
                if child.name == 'h3':
                    if current_elements:
                        content_html = "".join([str(el) for el in current_elements]).strip()
                        raw_text = re.sub(r'\s+', ' ', soup.new_tag('div').append(BeautifulSoup(content_html, 'html.parser')).get_text() if hasattr(BeautifulSoup(content_html, 'html.parser'), 'get_text') else "").strip()
                        
                        # Use a fallback for raw text if empty
                        if not raw_text:
                            raw_text = BeautifulSoup(content_html, 'html.parser').get_text().strip()
                        
                        updates.append({
                            'date': date_str,
                            'updated': updated_str,
                            'link': link_url,
                            'type': current_type,
                            'content': content_html,
                            'raw_text': raw_text
                        })
                        current_elements = []
                    current_type = child.get_text().strip()
                elif child.name is not None or (isinstance(child, str) and child.strip()):
                    current_elements.append(child)
                    
            if current_elements:
                content_html = "".join([str(el) for el in current_elements]).strip()
                raw_text = BeautifulSoup(content_html, 'html.parser').get_text().strip()
                
                updates.append({
                    'date': date_str,
                    'updated': updated_str,
                    'link': link_url,
                    'type': current_type,
                    'content': content_html,
                    'raw_text': re.sub(r'\s+', ' ', raw_text).strip()
                })
                
        return updates
    except Exception as e:
        print(f"Error parsing feed: {e}")
        return []

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/updates')
def get_updates():
    notes = parse_feed()
    return jsonify(notes)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
