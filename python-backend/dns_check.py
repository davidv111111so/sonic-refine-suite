import requests, json, warnings
warnings.filterwarnings("ignore")

r = requests.get("https://dns.google/resolve?name=levelaudio.live&type=CAA")
d = r.json()
if "Answer" in d:
    for a in d["Answer"]:
        print(f"CAA: {a.get('data','N/A')}")
else:
    print("CAA: No CAA records found (good - no restrictions)")

r2 = requests.get("https://dns.google/resolve?name=levelaudio.live&type=A")
d2 = r2.json()
if "Answer" in d2:
    for a in d2["Answer"]:
        print(f"A: {a.get('data','N/A')}")

r3 = requests.get("https://dns.google/resolve?name=www.levelaudio.live&type=A")
d3 = r3.json()
if "Answer" in d3:
    for a in d3["Answer"]:
        if a.get("type") == 5:
            print(f"WWW CNAME: {a.get('data','N/A')}")
        elif a.get("type") == 1:
            print(f"WWW A: {a.get('data','N/A')}")

# Check TLS on custom domain
try:
    r4 = requests.get("https://levelaudio.live", timeout=10, verify=True)
    print(f"HTTPS Verified: YES (status {r4.status_code})")
except requests.exceptions.SSLError as e:
    print(f"HTTPS Verified: NO (SSL Error)")
except Exception as e:
    print(f"HTTPS Check: {type(e).__name__}")

# Check HTTP (no SSL) 
try:
    r5 = requests.get("http://levelaudio.live", timeout=10, allow_redirects=False)
    print(f"HTTP Status: {r5.status_code}")
    print(f"HTTP Location: {r5.headers.get('location', 'N/A')}")
    print(f"HTTP Server: {r5.headers.get('server', 'N/A')}")
except Exception as e:
    print(f"HTTP: {type(e).__name__}: {e}")
