import json
import time
import urllib.parse
import urllib.request

def test_full_pipeline():
    data = urllib.parse.urlencode({
        'is_sample': 'true',
        'description': 'User browses catalog, clicks add to cart, tests checkout button'
    }).encode()

    req = urllib.request.Request('http://127.0.0.1:8000/upload', data=data)
    res = urllib.request.urlopen(req)
    run_id = json.loads(res.read().decode())['run_id']
    print(f"1. Enqueued scan: {run_id}")

    for i in range(25):
        time.sleep(2)
        poll_res = json.loads(urllib.request.urlopen(f'http://127.0.0.1:8000/scan/{run_id}').read().decode())
        pct = poll_res.get('progress_pct', 0)
        step = poll_res.get('current_step', '')
        status = poll_res.get('status', '')
        print(f"   [{i*2}s] ({pct}%) {step}")
        if status in ('complete', 'failed'):
            break

    rep_res = json.loads(urllib.request.urlopen(f'http://127.0.0.1:8000/reports/{run_id}').read().decode())
    print("\n2. Scan Completed! Report Summary:")
    print(f"   Total Pages Visited: {rep_res.get('total_pages_visited')}")
    print(f"   Summary Counts: {rep_res.get('summary_counts')}")
    print("\n3. Identified Bug Findings:")
    for f in rep_res.get('findings', []):
        print(f"   - [{f.get('severity', '').upper()}] {f.get('title')}")

if __name__ == '__main__':
    test_full_pipeline()
