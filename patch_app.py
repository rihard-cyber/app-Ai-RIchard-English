import re

app_path = 'e:/Apk. Englishku/src/App.jsx'
with open(app_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the Settings Header that was broken
broken_header = '<h3 className="font-bold text-white tracking-wide">{userProfile.name}</h3>\n                  <p className="text-xs text-slate-500">Pilih tampilan yang nyaman di mata.</p>'
fixed_header = '<h4 className="font-bold text-slate-800">Tema Aplikasi</h4>\n                  <p className="text-xs text-slate-500">Pilih tampilan yang nyaman di mata.</p>'
content = content.replace(broken_header, fixed_header)

# Fix the Sidebar User Name
sidebar_user = '<h3 className="font-bold text-white tracking-wide">User</h3>'
sidebar_fixed = '<h3 className="font-bold text-white tracking-wide">{userProfile.name}</h3>'
content = content.replace(sidebar_user, sidebar_fixed)

with open(app_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("App.jsx patched")
