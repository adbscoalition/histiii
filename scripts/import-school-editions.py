"""Read the supplied school DOCX pair without extracting or executing archive content.

Print canonical source JSON; website data is generated from this checked payload.
The web controls use five discrete 1–5 choices, not the paper's freeform scale.
"""
import argparse
import hashlib
import io
import json
import re
import xml.etree.ElementTree as ET
from zipfile import ZipFile

NS = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
CODE = r'(?:A1|A2|B|C)-\d{2}'


def read_edition(archive, edition):
    filename = f'HISTI-School-{edition.title()}.docx'
    raw = archive.read(filename)
    with ZipFile(io.BytesIO(raw)) as docx:
        root = ET.fromstring(docx.read('word/document.xml'))
    assert not root.findall('.//w:del', NS), 'Review tracked deletions before importing'
    blocks = []
    for child in root.find('w:body', NS):
        if child.tag.endswith('}p'):
            text = ''.join(node.text or '' for node in child.findall('.//w:t', NS))
            if text:
                blocks.append(text)
        elif child.tag.endswith('}tbl'):
            blocks.extend([[''.join(node.text or '' for node in cell.findall('.//w:t', NS)) for cell in row.findall('w:tc', NS)] for row in child.findall('w:tr', NS)])
    mappings, categories, questions, recipients = {}, {}, [], {}
    guides = next(block for block in blocks if isinstance(block, list) and len(block) == 5 and block[0] in ['Not okay at all', 'Not comfortable'])
    for index, block in enumerate(blocks):
        if isinstance(block, list):
            if len(block) == 3 and re.fullmatch(CODE, block[0]):
                title, maximum = re.fullmatch(r'(.+) · (\d+) pts', block[1]).groups()
                mappings[block[0]] = {'title': title, 'max': int(maximum), 'sourceIds': block[2]}
            if len(block) == 2 and re.match(r'G[1-4] · ', block[0]):
                code, label = block[0].split(' · ', 1)
                recipients[code] = {'label': label, 'description': block[1]}
            continue
        heading = re.fullmatch(r'(A1|A2|B|C)\s+/\s+(.+)', block)
        if heading:
            code, label = heading.groups()
            categories.setdefault(code, {'label': label, 'scope': blocks[index + 1]})
        item = re.fullmatch(r'(' + CODE + r')\s+\|\s+(.+?)\s+(0[–-]100|YES\s*/\s*NO)', block)
        if item:
            code, title, kind = item.groups()
            prompt = blocks[index + 1]
            assert isinstance(prompt, str) and '?' in prompt
            questions.append({'code': code, 'title': title, 'prompt': prompt, 'type': 'yn' if kind.startswith('YES') else 'slider'})
    assert len(questions) == len(mappings) == 48
    assert set(item['code'] for item in questions) == set(mappings)
    for item in questions:
        mapping = mappings[item['code']]
        assert item['title'] == mapping['title']
        item.update(mapping)
    assert sum(item['type'] == 'slider' for item in questions) == 44
    assert sum(item['max'] for item in questions) == 888
    assert set(recipients) == {'G1', 'G2', 'G3', 'G4'}
    assert any(isinstance(block, str) and '23×A1 + 25×A2 + 25×B + 20×C' in block for block in blocks)
    reflections = [re.sub(r'^[1-3]\.\s+', '', block) for block in blocks if isinstance(block, str) and re.match(r'^[1-3]\.\s+', block)]
    assert len(reflections) == 3
    return {
        'edition': edition, 'sourceName': filename, 'sourceSha256': hashlib.sha256(raw).hexdigest(),
        'sourceTitle': blocks[0], 'ages': '10–13' if edition == 'middle' else '14–18',
        'classMinutes': '35–50' if edition == 'middle' else '25–40',
        'guideLabels': guides, 'recipients': recipients, 'categories': categories,
        'items': questions, 'reflectionQuestions': reflections,
    }


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('archive')
    parser.add_argument('--edition', choices=['middle', 'high'], required=True)
    args = parser.parse_args()
    with ZipFile(args.archive) as archive:
        print(json.dumps(read_edition(archive, args.edition), ensure_ascii=False, indent=2))
