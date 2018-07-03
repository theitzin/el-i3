import sys
import xml.etree.ElementTree as ET
from datetime import datetime


def getChildData(child):
        title = child.find(ns + 'title').text
        summary = child.find(ns + 'summary').text
        date_str = child.find(ns + 'issued').text

        date = datetime.strptime(date_str, '%Y-%m-%dT%H:%M:%SZ')
        age = int((now - date).total_seconds() / 86400 / 7)  # seconds in week
        return {'title': title, 'summary': summary, 'date': date, 'age': age}

data = ''
for line in sys.stdin:
        data += line

try:
    root = ET.fromstring(data)
except ET.ParseError:
        print('-')
        sys.exit(0)

ns = '{http://purl.org/atom/ns#}'
now = datetime.now()
cnt = 0

for child in root.findall(ns + 'entry'):
        child_data = getChildData(child)
        if child_data['age'] < 7:
                cnt += 1

print(cnt, end='')